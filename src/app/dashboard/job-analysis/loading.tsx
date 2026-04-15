import { Skeleton } from "@/components/ui/skeleton";

export default function JobAnalysisLoading() {
  return (
    <div className="job-analysis-loading max-w-4xl mx-auto space-y-6">
      <div className="card space-y-4">
        <Skeleton className="skeleton-page-title h-7 w-40" />
        <Skeleton className="skeleton-page-subtitle h-4 w-72" />
        <div className="skeleton-mode-tabs flex gap-2">
          <Skeleton className="skeleton-tab h-8 w-24 rounded-lg" />
          <Skeleton className="skeleton-tab h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="skeleton-textarea h-48 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="skeleton-field-label h-4 w-28" />
            <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="skeleton-field-label h-4 w-20" />
            <Skeleton className="skeleton-field-input h-9 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="skeleton-submit-btn h-9 w-28 rounded-lg" />
      </div>
      <div className="card space-y-3">
        <Skeleton className="skeleton-section-title h-5 w-16" />
        <p className="text-sm text-text-secondary">No analyses yet.</p>
      </div>
    </div>
  );
}
