import Link from "next/link";
import type { Application, ApplicationStatus } from "@/types/application";
import { formatDate } from "@/utils/date";

const COLUMN_ORDER: ApplicationStatus[] = [
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "unknown",
];

const COLUMN_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  unknown: "Unknown",
};

const COLUMN_ACCENT: Record<ApplicationStatus, string> = {
  applied: "border-t-status-applied",
  assessment: "border-t-status-assessment",
  interview: "border-t-status-interview",
  offer: "border-t-status-offer",
  rejected: "border-t-status-rejected",
  unknown: "border-t-status-unknown",
};

const COUNT_CLASSES: Record<ApplicationStatus, string> = {
  applied: "badge-status-applied",
  assessment: "badge-status-assessment",
  interview: "badge-status-interview",
  offer: "badge-status-offer",
  rejected: "badge-status-rejected",
  unknown: "badge-status-unknown",
};

interface KanbanCardProps {
  application: Application;
}

function KanbanCard({ application }: KanbanCardProps) {
  return (
    <Link href={`/dashboard/${application.id}`}>
      <div className="kanban-card">
        <p className="kanban-card-company font-medium text-text-primary text-sm leading-snug">
          {application.company ?? "Unknown Company"}
        </p>
        <p className="kanban-card-role text-xs text-text-secondary mt-0.5">
          {application.role ?? "Unknown Role"}
        </p>
        {application.interview_date && (
          <p className="kanban-card-interview text-xs text-status-interview mt-2">
            Interview: {formatDate(application.interview_date)}
          </p>
        )}
        <p className="kanban-card-updated text-xs text-text-muted mt-2">
          {formatDate(application.application_updated_at ?? application.updated_at)}
        </p>
      </div>
    </Link>
  );
}

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
}

function KanbanColumn({ status, applications }: KanbanColumnProps) {
  return (
    <div className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[status]}`}>
      <div className="kanban-column-header flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="kanban-column-title text-sm font-semibold text-text-primary">
          {COLUMN_LABELS[status]}
        </span>
        <span className={`kanban-column-count badge ${COUNT_CLASSES[status]}`}>
          {applications.length}
        </span>
      </div>
      <div className="kanban-column-cards flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {applications.length === 0 ? (
          <p className="kanban-empty-state text-xs text-text-muted text-center py-6">No applications</p>
        ) : (
          applications.map((app) => (
            <KanbanCard key={app.id} application={app} />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  applications: Application[];
}

export function KanbanBoard({ applications }: KanbanBoardProps) {
  const grouped = COLUMN_ORDER.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  return (
    <div className="kanban-board flex gap-3 overflow-x-auto pb-4 min-w-0">
      {COLUMN_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          applications={grouped[status]}
        />
      ))}
    </div>
  );
}
