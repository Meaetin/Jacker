import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUSES } from "@/types/application";

export default function DashboardLoading() {
  return (
    <div className="dashboard-loading">
      <div className="dashboard-loading-header flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="kanban-loading flex gap-3 overflow-x-hidden">
        {APPLICATION_STATUSES.map((status) => (
          <div
            key={status}
            className="kanban-loading-column flex-shrink-0 w-64 rounded-lg border border-border bg-surface-raised"
          >
            <div className="kanban-loading-header flex items-center justify-between px-3 py-2.5 border-b border-border">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="kanban-loading-cards flex flex-col gap-2 p-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="kanban-loading-card bg-surface border border-border rounded-lg p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3 mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
