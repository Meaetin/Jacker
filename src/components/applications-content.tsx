"use client";

import { useState, useMemo } from "react";
import { ApplicationTable } from "@/components/application-table";
import { KanbanBoard } from "@/components/kanban-board";
import { FilterBar } from "@/components/filter-bar";
import { DashboardActions } from "@/components/dashboard-actions";
import { ViewToggle } from "@/components/view-toggle";
import type { Application, ApplicationStatus } from "@/types/application";

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
  const [view, setView] = useState<"table" | "kanban">(initialView);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);

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
    merged.view ? url.searchParams.set("view", merged.view) : url.searchParams.delete("view");
    merged.status ? url.searchParams.set("status", merged.status) : url.searchParams.delete("status");
    merged.search ? url.searchParams.set("search", merged.search) : url.searchParams.delete("search");
    window.history.replaceState({}, "", url.toString());
  }

  const filtered = useMemo(() => {
    let result = applications;
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
  }, [applications, status, search]);

  if (!gmailConnected) {
    return <DashboardActions gmailConnected={false} />;
  }

  return (
    <>
      <div className="dashboard-controls mb-4 flex items-center justify-between">
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
        ? <KanbanBoard applications={filtered} />
        : <ApplicationTable applications={filtered} />
      }
    </>
  );
}
