"use client";

import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Application, ApplicationStatus } from "@/types/application";
import { formatDate } from "@/utils/date";

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

type DragType = "card" | "column";

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

/** Pure column header — reused by the live column, the SSR fallback, and the DragOverlay */
function KanbanColumnHeader({
  status,
  count,
  handleAttributes,
  handleListeners,
}: {
  status: ApplicationStatus;
  count: number;
  handleAttributes?: DraggableAttributes;
  handleListeners?: DraggableSyntheticListeners;
}) {
  return (
    <div className="kanban-column-header flex items-center gap-2 px-3 py-2.5 border-b border-border">
      <button
        type="button"
        className="kanban-column-drag-handle flex-shrink-0 touch-none"
        aria-label={`Reorder ${COLUMN_LABELS[status]} column`}
        {...handleAttributes}
        {...handleListeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="kanban-column-title flex-1 text-sm font-semibold text-text-primary">
        {COLUMN_LABELS[status]}
      </span>
      <span className={`kanban-column-count badge ${COUNT_CLASSES[status]}`}>{count}</span>
    </div>
  );
}

interface KanbanCardProps {
  application: Application;
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
  onCardClick: (applicationId: string) => void;
}

function KanbanCard({ application, onContextMenu, onCardClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { type: "card" satisfies DragType },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`kanban-card kanban-card-link cursor-pointer ${isDragging ? "kanban-card-dragging" : ""}`}
      onContextMenu={(e) => onContextMenu(e, application.id)}
      onClick={() => onCardClick(application.id)}
    >
      <KanbanCardContent application={application} />
    </div>
  );
}

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  activeType: DragType | null;
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
  onCardClick: (applicationId: string) => void;
}

function KanbanColumn({ status, applications, activeType, onContextMenu, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({
    id: status,
    data: { type: "column" satisfies DragType },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // `isOver` fires for both a card hovering and a column hovering during a
  // reorder — only show the card drop-target glow during a card drag.
  const showDropTarget = isOver && activeType === "card";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[status]} ${showDropTarget ? "kanban-column-drop-target" : ""} ${isDragging ? "kanban-column-dragging" : ""}`}
    >
      <KanbanColumnHeader
        status={status}
        count={applications.length}
        handleAttributes={attributes}
        handleListeners={listeners}
      />
      <div className="kanban-column-cards flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {applications.length === 0 ? (
          <p className="kanban-empty-state text-xs text-text-muted text-center py-6">No applications</p>
        ) : (
          applications.map((app) => (
            <KanbanCard key={app.id} application={app} onContextMenu={onContextMenu} onCardClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}

/** Static fallback rendered during SSR to avoid hydration mismatches from DnD hooks */
function KanbanBoardStatic({ columnOrder, applications, onContextMenu, onCardClick }: {
  columnOrder: ApplicationStatus[];
  applications: Application[];
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
  onCardClick: (applicationId: string) => void;
}) {
  const grouped = columnOrder.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  return (
    <div className="kanban-board flex gap-3 overflow-x-auto pb-4 min-w-0">
      {columnOrder.map((status) => {
        const apps = grouped[status];
        return (
          <div
            key={status}
            className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[status]}`}
          >
            <KanbanColumnHeader status={status} count={apps.length} />
            <div className="kanban-column-cards flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {apps.length === 0 ? (
                <p className="kanban-empty-state text-xs text-text-muted text-center py-6">No applications</p>
              ) : (
                apps.map((app) => (
                  <div
                    key={app.id}
                    className="kanban-card kanban-card-link cursor-pointer"
                    onContextMenu={(e) => onContextMenu(e, app.id)}
                    onClick={() => onCardClick(app.id)}
                  >
                    <KanbanCardContent application={app} />
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
  columnOrder: ApplicationStatus[];
  onColumnOrderChange: (order: ApplicationStatus[]) => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onContextMenu: (e: React.MouseEvent, applicationId: string) => void;
  onCardClick: (applicationId: string) => void;
}

export function KanbanBoard({
  applications,
  columnOrder,
  onColumnOrderChange,
  onStatusChange,
  onContextMenu,
  onCardClick,
}: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Suppress the click the browser fires after a drag completes, so dropping a
  // card doesn't also open the detail modal.
  const justDraggedRef = useRef(false);
  function handleCardClick(id: string) {
    if (justDraggedRef.current) return;
    onCardClick(id);
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<DragType | null>(null);
  const [overId, setOverId] = useState<ApplicationStatus | null>(null);

  const grouped = columnOrder.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  const activeApp = activeType === "card" && activeId ? applications.find((a) => a.id === activeId) : null;
  const activeColumn = activeType === "column" ? (activeId as ApplicationStatus | null) : null;

  /** During a card drag: remove active card from all columns, prepend to hovered column */
  const displayGrouped = columnOrder.reduce<Record<ApplicationStatus, Application[]>>(
    (acc, status) => {
      let col = grouped[status];

      if (activeApp) {
        col = col.filter((a) => a.id !== activeApp.id);
      }

      // Prepend to the top of the hovered column
      if (activeApp && overId === status) {
        col = [activeApp, ...col];
      }

      acc[status] = col;
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );

  function handleDragStart(event: DragStartEvent) {
    const type = (event.active.data.current?.type as DragType | undefined) ?? "card";
    setActiveType(type);
    setActiveId(event.active.id as string);
    // Only card drags can land on a clickable card and open the modal.
    if (type === "card") justDraggedRef.current = true;
  }

  function handleDragOver(event: DragOverEvent) {
    // Column reordering is handled by the sortable strategy; don't drive the
    // card drop-target preview from it.
    if (event.active.data.current?.type === "column") return;
    const { over } = event;
    setOverId(over ? (over.id as ApplicationStatus) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type as DragType | undefined;

    if (type === "column") {
      if (over && active.id !== over.id) {
        const from = columnOrder.indexOf(active.id as ApplicationStatus);
        const to = columnOrder.indexOf(over.id as ApplicationStatus);
        if (from !== -1 && to !== -1) {
          onColumnOrderChange(arrayMove(columnOrder, from, to));
        }
      }
    } else {
      const applicationId = active.id as string;
      const targetStatus = over?.id as ApplicationStatus | undefined;
      if (targetStatus) {
        const app = applications.find((a) => a.id === applicationId);
        if (app && app.status !== targetStatus) {
          onStatusChange(applicationId, targetStatus);
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
    setOverId(null);
    // Reset after the trailing click event has been dispatched.
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
  }

  // Render static HTML on first pass to avoid hydration mismatch from DnD hooks
  if (!mounted) {
    return (
      <KanbanBoardStatic
        columnOrder={columnOrder}
        applications={applications}
        onContextMenu={onContextMenu}
        onCardClick={onCardClick}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
        <div className="kanban-board flex gap-3 overflow-x-auto pb-4 min-w-0">
          {columnOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={displayGrouped[status]}
              activeType={activeType}
              onContextMenu={onContextMenu}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeType === "card" && activeApp ? (
          <div className="kanban-card kanban-card-overlay">
            <KanbanCardContent application={activeApp} />
          </div>
        ) : activeType === "column" && activeColumn ? (
          <div
            className={`kanban-column kanban-column-overlay w-64 flex flex-col rounded-lg border border-border border-t-2 bg-surface-raised ${COLUMN_ACCENT[activeColumn]}`}
          >
            <KanbanColumnHeader status={activeColumn} count={grouped[activeColumn].length} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
