"use client";

import { useState, useMemo } from "react";
import { ApplicationTable } from "@/components/application-table";
import { KanbanBoard } from "@/components/kanban-board";
import { FilterBar } from "@/components/filter-bar";
import { DashboardActions } from "@/components/dashboard-actions";
import { ViewToggle } from "@/components/view-toggle";
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

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ApplicationStatus, number>> = {};
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    }
    return counts;
  }, [applications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return applications.filter(
      (a) => a.interview_date && new Date(a.interview_date) >= now
    ).length;
  }, [applications]);

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
        ? <KanbanBoard applications={filtered} />
        : <ApplicationTable applications={filtered} />
      }
    </div>
  );
}
