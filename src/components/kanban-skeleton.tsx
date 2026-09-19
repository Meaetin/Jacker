import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUSES } from "@/types/application";

/**
 * Placeholder board. Rendered by the dashboard's Suspense boundary on first
 * paint, and by the client while a view switch loads the full board.
 */
export function KanbanSkeleton() {
  return (
    <div className="kanban-skeleton flex gap-3 overflow-x-hidden">
      {[...APPLICATION_STATUSES.filter((s) => s !== "unknown"), "unknown" as const].map((status) => (
        <div
          key={status}
          className="kanban-skeleton-column flex-shrink-0 w-64 rounded-lg border border-border bg-surface-raised"
        >
          <div className="kanban-skeleton-header flex items-center justify-between px-3 py-2.5 border-b border-border">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="kanban-skeleton-cards flex flex-col gap-2 p-2">
            {Array.from({ length: status === "applied" ? 3 : status === "rejected" ? 2 : 1 }).map((_, i) => (
              <div key={i} className="kanban-skeleton-card bg-surface border border-border rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
