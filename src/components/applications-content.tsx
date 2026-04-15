"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { ApplicationTable } from "@/components/application-table";
import { KanbanBoard } from "@/components/kanban-board";
import { FilterBar } from "@/components/filter-bar";
import { DashboardActions } from "@/components/dashboard-actions";
import { ViewToggle } from "@/components/view-toggle";
import { Dialog } from "@/components/ui/dialog";
import { ContextMenu } from "@/components/ui/context-menu";
import { ApplicationForm } from "@/components/application-form";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import type { Application, ApplicationStatus } from "@/types/application";

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
  gmailConnected: boolean;
  initialView: "table" | "kanban";
  initialStatus: string;
  initialSearch: string;
}

export function ApplicationsContent({
  applications,
  gmailConnected,
  initialView,
  initialStatus,
  initialSearch,
}: ApplicationsContentProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">(initialView);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);

  // Local mutable copy for optimistic updates
  const [localApplications, setLocalApplications] = useState(applications);
  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

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

  // DnD status change handler (optimistic)
  function handleDragStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    const prevApp = localApplications.find((a) => a.id === applicationId);
    if (!prevApp) return;

    // Optimistic update
    setLocalApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );

    fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then((res) => {
      if (!res.ok) {
        // Rollback on failure
        setLocalApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: prevApp.status } : a))
        );
      }
    });
  }

  // Delete handler
  async function handleDeleteConfirm() {
    if (!deletingApplication) return;
    const res = await fetch(`/api/applications/${deletingApplication.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLocalApplications((prev) => prev.filter((a) => a.id !== deletingApplication.id));
      setDeleteDialogOpen(false);
      setDeletingApplication(null);
    }
  }

  // Edit success handler
  function handleEditSuccess() {
    setEditDialogOpen(false);
    setEditingApplication(null);
    router.refresh();
  }

  const filtered = useMemo(() => {
    let result = localApplications;
    if (status) {
      result = result.filter((a) => a.status === (status as ApplicationStatus));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [localApplications, status, search]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ApplicationStatus, number>> = {};
    for (const app of localApplications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    }
    return counts;
  }, [localApplications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return localApplications.filter(
      (a) => a.interview_date && new Date(a.interview_date) >= now
    ).length;
  }, [localApplications]);

  if (!gmailConnected) {
    return <DashboardActions gmailConnected={false} />;
  }

  return (
    <div className="max-w-[80rem] mx-auto">
      <div className="dashboard-stats flex flex-wrap items-center gap-2">
        {STATUS_SUMMARY_ORDER.map((s) => {
          const count = statusCounts[s];
          if (!count) return null;
          return (
            <span key={s} className={`dashboard-stat-chip badge ${STATUS_CHIP_CLASSES[s]}`}>
              {count} {STATUS_LABELS[s]}
            </span>
          );
        })}
        {upcomingInterviews > 0 && (
          <span className="dashboard-upcoming-badge badge bg-brand-light text-brand font-medium">
            {upcomingInterviews} upcoming interview{upcomingInterviews !== 1 ? "s" : ""}
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
        <DashboardActions gmailConnected={true} />
      </div>
      {view === "kanban"
        ? <KanbanBoard applications={filtered} onStatusChange={handleDragStatusChange} onContextMenu={handleContextMenu} />
        : <ApplicationTable applications={filtered} onContextMenu={handleContextMenu} />
      }

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: "Edit", icon: <Pencil size={14} />, onClick: handleEditFromMenu },
            { label: "Delete", icon: <Trash2 size={14} />, onClick: handleDeleteFromMenu, danger: true },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        {editingApplication && (
          <ApplicationForm application={editingApplication} onSuccess={handleEditSuccess} />
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
    </div>
  );
}
