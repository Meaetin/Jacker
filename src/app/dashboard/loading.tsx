import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-[80rem] mx-auto">
      <div className="dashboard-loading-header flex items-center gap-3 mb-4">
        <Skeleton className="skeleton-title h-7 w-32" />
        <Skeleton className="skeleton-toggle h-8 w-64 rounded-lg" />
      </div>
      <div className="dashboard-loading-stats flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-stat h-6 w-24 rounded-full" />
        ))}
      </div>
      <div className="dashboard-loading-controls flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <Skeleton className="skeleton-view-toggle h-8 w-48 rounded-lg" />
          <Skeleton className="skeleton-filter h-8 w-64 rounded-lg" />
        </div>
        <Skeleton className="skeleton-sync-btn h-8 w-8 rounded-lg" />
      </div>
      <div className="dashboard-loading-table space-y-3">
        <div className="flex gap-4 pb-3 border-b border-border">
          <Skeleton className="skeleton-col-head h-4 w-24" />
          <Skeleton className="skeleton-col-head h-4 w-20" />
          <Skeleton className="skeleton-col-head h-4 w-16" />
          <Skeleton className="skeleton-col-head h-4 w-28" />
          <Skeleton className="skeleton-col-head h-4 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-border">
            <Skeleton className="skeleton-cell h-4 w-32" />
            <Skeleton className="skeleton-cell h-4 w-28" />
            <Skeleton className="skeleton-cell h-5 w-20 rounded-full" />
            <Skeleton className="skeleton-cell h-4 w-24" />
            <Skeleton className="skeleton-cell h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
