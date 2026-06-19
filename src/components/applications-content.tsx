"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { KanbanBoard } from "@/components/kanban-board";
import { FilterBar } from "@/components/filter-bar";
import { DashboardActions } from "@/components/dashboard-actions";
import { ViewToggle } from "@/components/view-toggle";
import { Dialog } from "@/components/ui/dialog";
import { ContextMenu } from "@/components/ui/context-menu";
import { ApplicationForm } from "@/components/application-form";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ApplicationModal } from "@/components/application-modal";
import { useRealtimeApplications } from "@/hooks/use-realtime-applications";
import type { ApplicationStats } from "@/lib/db/applications";
import type { Application, ApplicationStatus } from "@/types/application";

const PAGE_SIZE = 20;
const KANBAN_LIMIT = 1000;

const STATUS_SUMMARY_ORDER: ApplicationStatus[] = [
  "interview",
  "offer",
  "assessment",
  "applied",
  "rejected",
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview: "Interview",
  assessment: "Assessment",
  rejected: "Rejected",
  offer: "Offer",
  unknown: "Unknown",
};

const STATUS_CHIP_CLASSES: Record<ApplicationStatus, string> = {
  applied: "badge-status-applied",
  interview: "badge-status-interview",
  assessment: "badge-status-assessment",
  rejected: "badge-status-rejected",
  offer: "badge-status-offer",
  unknown: "badge-status-unknown",
};

interface ApplicationsContentProps {
  applications: Application[];
  total: number;
  stats: ApplicationStats;
  userId: string;
  gmailConnected: boolean;
  lastSyncAt: string | null;
  isDemo?: boolean;
  initialView: "table" | "kanban";
  initialStatus: string;
  initialSearch: string;
  initialColumnOrder: ApplicationStatus[];
}

export function ApplicationsContent({
  applications,
  total: initialTotal,
  stats: initialStats,
  userId,
  gmailConnected,
  lastSyncAt,
  isDemo = false,
  initialView,
  initialStatus,
  initialSearch,
  initialColumnOrder,
}: ApplicationsContentProps) {
  const [view, setView] = useState<"table" | "kanban">(initialView);
  const [columnOrder, setColumnOrder] = useState<ApplicationStatus[]>(initialColumnOrder);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Loaded rows for the current filter/view (paginated in table view).
  const [localApplications, setLocalApplications] = useState(applications);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialView === "table" && applications.length < initialTotal
  );
  const [loadingMore, setLoadingMore] = useState(false);

  // Aggregate stats over ALL rows (not just the loaded page).
  const [stats, setStats] = useState(initialStats);

  // Mirror of the loaded list for use inside async callbacks without stale closures.
  const listRef = useRef(localApplications);
  useEffect(() => {
    listRef.current = localApplications;
  }, [localApplications]);

  // Monotonic token to discard responses from superseded fetches. Toggling the
  // view (or changing a filter) starts a new request; without this guard, a
  // slow in-flight fetch from the previous view can resolve later and overwrite
  // the list with the wrong dataset (e.g. the 1000-row kanban load landing on
  // the 20-row table), which shows as the table ballooning then snapping back.
  const requestIdRef = useRef(0);

  const refreshStats = useCallback(async () => {
    const res = await fetch("/api/applications/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const buildQuery = useCallback(
    (pageNum: number, forView: "table" | "kanban") => {
      const params = new URLSearchParams();
      if (forView === "kanban") {
        params.set("limit", String(KANBAN_LIMIT));
        params.set("page", "1");
      } else {
        params.set("limit", String(PAGE_SIZE));
        params.set("page", String(pageNum));
        if (status) params.set("status", status);
      }
      if (debouncedSearch) params.set("search", debouncedSearch);
      return params.toString();
    },
    [status, debouncedSearch]
  );

  const fetchApplications = useCallback(
    async (pageNum: number, append: boolean) => {
      const reqId = ++requestIdRef.current;
      const res = await fetch(`/api/applications?${buildQuery(pageNum, view)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        applications: Application[];
        total: number;
      };

      // A newer fetch started while this one was in flight — drop this result.
      if (reqId !== requestIdRef.current) return;

      const base = append ? listRef.current : [];
      const seen = new Set(base.map((a) => a.id));
      const merged = [...base, ...data.applications.filter((a) => !seen.has(a.id))];

      listRef.current = merged;
      setLocalApplications(merged);
      setPage(pageNum);
      setHasMore(view === "table" && merged.length < data.total);
    },
    [buildQuery, view]
  );

  // Debounce the search input before it drives a refetch.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reload page 1 whenever the filter or view changes (skip the initial mount —
  // the server already provided the first page).
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setLoadingMore(true);
    fetchApplications(1, false).finally(() => setLoadingMore(false));
  }, [status, debouncedSearch, view, fetchApplications]);

  // Infinite scroll (table view only).
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view !== "table" || !hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          fetchApplications(page + 1, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, hasMore, loadingMore, page, fetchApplications]);

  // Detail modal selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedApp = useMemo(
    () => localApplications.find((a) => a.id === selectedId) ?? null,
    [localApplications, selectedId]
  );

  // Optimistic mutators shared by the modal, context menu, and realtime.
  const applyEdit = useCallback(
    (updated: Application) => {
      setLocalApplications((prev) => {
        // If a status filter is active and the row no longer matches, drop it.
        if (status && updated.status !== status) {
          return prev.filter((a) => a.id !== updated.id);
        }
        return prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
      });
      refreshStats();
    },
    [status, refreshStats]
  );

  const applyStatus = useCallback(
    (id: string, newStatus: ApplicationStatus) => {
      setLocalApplications((prev) => {
        if (status && newStatus !== status) {
          return prev.filter((a) => a.id !== id);
        }
        return prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
      });
      refreshStats();
    },
    [status, refreshStats]
  );

  const applyDelete = useCallback(
    (id: string) => {
      setLocalApplications((prev) => prev.filter((a) => a.id !== id));
      refreshStats();
    },
    [refreshStats]
  );

  // Realtime: stream inserts/updates/deletes from the DB into the loaded list.
  const upsertFromRealtime = useCallback(
    (row: Application) => {
      setLocalApplications((prev) => {
        const exists = prev.some((a) => a.id === row.id);
        // Respect an active status filter on inserts/updates.
        if (status && row.status !== status) {
          return exists ? prev.filter((a) => a.id !== row.id) : prev;
        }
        if (exists) {
          return prev.map((a) => (a.id === row.id ? { ...a, ...row } : a));
        }
        // New row: prepend (newest application_updated_at sorts to the top).
        return [row, ...prev];
      });
      refreshStats();
    },
    [status, refreshStats]
  );

  const removeFromRealtime = useCallback(
    (id: string) => {
      setLocalApplications((prev) => prev.filter((a) => a.id !== id));
      refreshStats();
    },
    [refreshStats]
  );

  useRealtimeApplications(userId, {
    onUpsert: upsertFromRealtime,
    onDelete: removeFromRealtime,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    applicationId: string;
  } | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingApplication, setDeletingApplication] = useState<Application | null>(null);

  function handleViewChange(next: "table" | "kanban") {
    setView(next);
    if (next === "table") {
      // Trim the (possibly full) kanban set to one page before the table
      // renders it, so the table doesn't momentarily show every row while the
      // page-1 fetch is in flight. Paging state is reset to match.
      setLocalApplications((prev) => prev.slice(0, PAGE_SIZE));
      setPage(1);
      setHasMore(false);
    }
    syncUrl({ view: next });
  }

  function handleStatusChange(next: string) {
    setStatus(next);
    syncUrl({ status: next });
  }

  function handleSearchChange(next: string) {
    setSearch(next);
    syncUrl({ search: next });
  }

  function syncUrl(overrides: Record<string, string>) {
    const url = new URL(window.location.href);
    const merged = { view, status, search, ...overrides };

    if (merged.view) {
      url.searchParams.set("view", merged.view);
    } else {
      url.searchParams.delete("view");
    }

    if (merged.status) {
      url.searchParams.set("status", merged.status);
    } else {
      url.searchParams.delete("status");
    }

    if (merged.search) {
      url.searchParams.set("search", merged.search);
    } else {
      url.searchParams.delete("search");
    }

    window.history.replaceState({}, "", url.toString());
  }

  // Context menu handlers
  function handleContextMenu(e: React.MouseEvent, applicationId: string) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, applicationId });
  }

  function handleEditFromMenu() {
    const app = localApplications.find((a) => a.id === contextMenu?.applicationId);
    if (app) {
      setEditingApplication(app);
      setEditDialogOpen(true);
    }
    setContextMenu(null);
  }

  function handleDeleteFromMenu() {
    const app = localApplications.find((a) => a.id === contextMenu?.applicationId);
    if (app) {
      setDeletingApplication(app);
      setDeleteDialogOpen(true);
    }
    setContextMenu(null);
  }

  // DnD status change handler (optimistic, kanban only)
  function handleDragStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    const prevApp = localApplications.find((a) => a.id === applicationId);
    if (!prevApp) return;

    setLocalApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );

    fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then((res) => {
      if (!res.ok) {
        setLocalApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: prevApp.status } : a))
        );
      } else {
        refreshStats();
      }
    });
  }

  // Kanban column reorder handler (optimistic, persisted per-account)
  function handleColumnOrderChange(nextOrder: ApplicationStatus[]) {
    const prevOrder = columnOrder;
    setColumnOrder(nextOrder);

    // Demo accounts can't persist; keep the reorder in-session only.
    if (isDemo) return;

    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kanbanColumnOrder: nextOrder }),
    }).then((res) => {
      if (!res.ok) setColumnOrder(prevOrder);
    });
  }

  // Delete handler
  async function handleDeleteConfirm() {
    if (!deletingApplication) return;
    const res = await fetch(`/api/applications/${deletingApplication.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      applyDelete(deletingApplication.id);
      setDeleteDialogOpen(false);
      setDeletingApplication(null);
    }
  }

  // Edit success handler
  function handleEditSuccess(updated: Application) {
    applyEdit(updated);
    setEditDialogOpen(false);
    setEditingApplication(null);
  }

  if (!gmailConnected && !isDemo) {
    return <DashboardActions gmailConnected={false} />;
  }

  return (
    <div className="max-w-[80rem] mx-auto">
      <div className="dashboard-stats flex flex-wrap items-center gap-2">
        {STATUS_SUMMARY_ORDER.map((s) => {
          const count = stats.counts[s];
          if (!count) return null;
          return (
            <span key={s} className={`dashboard-stat-chip badge ${STATUS_CHIP_CLASSES[s]}`}>
              {count} {STATUS_LABELS[s]}
            </span>
          );
        })}
        {stats.upcomingInterviews > 0 && (
          <span className="dashboard-upcoming-badge badge bg-brand-light text-brand font-medium">
            {stats.upcomingInterviews} upcoming interview
            {stats.upcomingInterviews !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="dashboard-controls mt-4 mb-4 flex items-center justify-between">
        <div className="dashboard-controls-left flex items-center gap-4">
          <ViewToggle view={view} onViewChange={handleViewChange} />
          <FilterBar
            view={view}
            status={status}
            search={search}
            onStatusChange={handleStatusChange}
            onSearchChange={handleSearchChange}
          />
        </div>
        <DashboardActions gmailConnected={true} isDemo={isDemo} userId={userId} lastSyncAt={lastSyncAt} />
      </div>
      {view === "kanban" ? (
        <KanbanBoard
          applications={localApplications}
          columnOrder={columnOrder}
          onColumnOrderChange={handleColumnOrderChange}
          onStatusChange={handleDragStatusChange}
          onContextMenu={handleContextMenu}
          onCardClick={setSelectedId}
        />
      ) : (
        <>
          <ApplicationTable
            applications={localApplications}
            onContextMenu={handleContextMenu}
            onRowClick={setSelectedId}
          />
          {/* Infinite-scroll sentinel + loading indicator */}
          <div ref={sentinelRef} className="table-scroll-sentinel h-px" />
          {loadingMore && (
            <div className="table-loading-more flex items-center justify-center gap-2 py-4 text-sm text-text-secondary">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading more…
            </div>
          )}
        </>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: "Edit", icon: <Pencil size={14} />, onClick: handleEditFromMenu },
            ...(!isDemo ? [{ label: "Delete", icon: <Trash2 size={14} />, onClick: handleDeleteFromMenu, danger: true }] : []),
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        {editingApplication && (
          <ApplicationForm
            application={editingApplication}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setEditDialogOpen(false);
              setEditingApplication(null);
            }}
          />
        )}
      </Dialog>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        application={deletingApplication}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingApplication(null);
        }}
      />

      {/* Detail modal */}
      <ApplicationModal
        application={selectedApp}
        open={!!selectedId}
        isDemo={isDemo}
        onClose={() => setSelectedId(null)}
        onEdited={applyEdit}
        onStatusChanged={applyStatus}
        onDeleted={applyDelete}
      />
    </div>
  );
}
