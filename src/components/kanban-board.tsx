"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
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

/** Pure card content — no DnD hooks, safe to render in DragOverlay */
function KanbanCardContent({ application }: { application: Application }) {
  return (
    <>
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
    </>
  );
}

interface KanbanCardProps {
  application: Application;
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
}

function KanbanCard({ application, onContextMenu }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isDragging ? "kanban-card-dragging" : ""}`}
      onContextMenu={(e) => onContextMenu(e, application.id)}
    >
      <Link href={`/dashboard/${application.id}`} className="kanban-card-link block">
        <KanbanCardContent application={application} />
      </Link>
    </div>
  );
}

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
}

function KanbanColumn({ status, applications, onContextMenu }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[status]} ${isOver ? "kanban-column-drop-target" : ""}`}
    >
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
            <KanbanCard key={app.id} application={app} onContextMenu={onContextMenu} />
          ))
        )}
      </div>
    </div>
  );
}

/** Static fallback rendered during SSR to avoid hydration mismatches from DnD hooks */
function KanbanBoardStatic({ applications, onContextMenu }: {
  applications: Application[];
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
}) {
  const grouped = COLUMN_ORDER.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  return (
    <div className="kanban-board flex gap-3 overflow-x-auto pb-4 min-w-0">
      {COLUMN_ORDER.map((status) => {
        const apps = grouped[status];
        return (
          <div
            key={status}
            className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[status]}`}
          >
            <div className="kanban-column-header flex items-center justify-between px-3 py-2.5 border-b border-border">
              <span className="kanban-column-title text-sm font-semibold text-text-primary">
                {COLUMN_LABELS[status]}
              </span>
              <span className={`kanban-column-count badge ${COUNT_CLASSES[status]}`}>
                {apps.length}
              </span>
            </div>
            <div className="kanban-column-cards flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {apps.length === 0 ? (
                <p className="kanban-empty-state text-xs text-text-muted text-center py-6">No applications</p>
              ) : (
                apps.map((app) => (
                  <div key={app.id} className="kanban-card" onContextMenu={(e) => onContextMenu(e, app.id)}>
                    <Link href={`/dashboard/${app.id}`} className="kanban-card-link block">
                      <KanbanCardContent application={app} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
}

export function KanbanBoard({ applications, onStatusChange, onContextMenu }: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<ApplicationStatus | null>(null);

  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  const grouped = COLUMN_ORDER.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  /** During drag: remove active card from all columns, prepend to hovered column */
  const displayGrouped = COLUMN_ORDER.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      let col = grouped[status];

      if (activeId) {
        col = col.filter((a) => a.id !== activeId);
      }

      // Prepend to the top of the hovered column
      if (activeId && overId === status && activeApp) {
        col = [activeApp, ...col];
      }

      acc[status] = col;
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    setOverId(over ? (over.id as ApplicationStatus) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const applicationId = active.id as string;
    const targetStatus = over?.id as ApplicationStatus | undefined;

    if (targetStatus) {
      const app = applications.find((a) => a.id === applicationId);
      if (app && app.status !== targetStatus) {
        onStatusChange(applicationId, targetStatus);
      }
    }

    setActiveId(null);
    setOverId(null);
  }

  // Render static HTML on first pass to avoid hydration mismatch from DnD hooks
  if (!mounted) {
    return <KanbanBoardStatic applications={applications} onContextMenu={onContextMenu} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board flex gap-3 overflow-x-auto pb-4 min-w-0">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={displayGrouped[status]}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? (
          <div className="kanban-card kanban-card-overlay">
            <KanbanCardContent application={activeApp} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
