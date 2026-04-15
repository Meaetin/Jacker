import { Skeleton } from "@/components/ui/skeleton";

export default function DetailLoading() {
  return (
    <div className="detail-loading max-w-2xl mx-auto">
      <div className="detail-loading-breadcrumbs mb-6 flex items-center gap-1.5">
        <Skeleton className="skeleton-breadcrumb h-4 w-20" />
        <Skeleton className="skeleton-breadcrumb-sep h-4 w-2" />
        <Skeleton className="skeleton-breadcrumb h-4 w-24" />
      </div>
      <div className="card">
        <div className="detail-loading-header flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="skeleton-company h-6 w-48" />
            <Skeleton className="skeleton-role h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="skeleton-status h-6 w-24 rounded-full" />
            <Skeleton className="skeleton-edit-btn h-8 w-16 rounded-lg" />
          </div>
        </div>
        <div className="detail-loading-fields mt-6 space-y-4">
          <div className="space-y-1">
            <Skeleton className="skeleton-field-label h-4 w-20" />
            <Skeleton className="skeleton-field-bar h-3 w-full rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="skeleton-field-label h-4 w-28" />
            <Skeleton className="skeleton-field-value h-4 w-40" />
          </div>
          <div className="space-y-1">
            <Skeleton className="skeleton-field-label h-4 w-16" />
            <Skeleton className="skeleton-field-value h-4 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="skeleton-meta h-3 w-28" />
            <Skeleton className="skeleton-meta h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
