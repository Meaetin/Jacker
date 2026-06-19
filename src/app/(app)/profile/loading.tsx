import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="profile-loading max-w-4xl mx-auto space-y-6">
      <div className="card">
        <Skeleton className="skeleton-page-title h-7 w-40 mb-2" />
        <Skeleton className="skeleton-page-subtitle h-4 w-64" />
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="skeleton-field-label h-4 w-16" />
            <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="skeleton-field-label h-4 w-20" />
            <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="skeleton-field-label h-4 w-20" />
          <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
        </div>
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-28 mb-3" />
        <Skeleton className="skeleton-textarea h-36 w-full rounded-lg" />
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-40 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="skeleton-field-label h-4 w-20" />
              <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-24 mb-3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton-card-row grid grid-cols-2 gap-3 p-3 rounded-lg border border-border">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-32 mb-3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton-card-row space-y-2 p-3 rounded-lg border border-border">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        <Skeleton className="skeleton-section-title h-5 w-28 mb-3" />
        <Skeleton className="skeleton-textarea h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
