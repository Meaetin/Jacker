import { Skeleton } from "@/components/ui/skeleton";

export default function EditLoading() {
  return (
    <div className="edit-loading max-w-2xl mx-auto">
      <div className="edit-loading-breadcrumbs mb-6 flex items-center gap-1.5">
        <Skeleton className="skeleton-breadcrumb h-4 w-20" />
        <Skeleton className="skeleton-breadcrumb-sep h-4 w-2" />
        <Skeleton className="skeleton-breadcrumb h-4 w-24" />
        <Skeleton className="skeleton-breadcrumb-sep h-4 w-2" />
        <Skeleton className="skeleton-breadcrumb h-4 w-12" />
      </div>
      <div className="card">
        <Skeleton className="skeleton-page-title h-6 w-44 mb-6" />
        <div className="edit-loading-form space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="skeleton-form-label h-4 w-24" />
              <Skeleton className="skeleton-form-input h-9 w-full rounded-lg" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="skeleton-submit-btn h-9 w-28 rounded-lg" />
            <Skeleton className="skeleton-cancel-btn h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
