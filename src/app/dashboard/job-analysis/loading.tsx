import { Skeleton } from "@/components/ui/skeleton";

export default function JobAnalysisLoading() {
  return (
    <div className="job-analysis-loading max-w-6xl mx-auto">
      <div className="loading-layout flex gap-6">
        {/* Left pane skeleton */}
        <div className="loading-left w-[320px] flex-shrink-0 space-y-1.5">
          <div className="loading-left-header flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-6 w-12 rounded-lg" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="loading-history-item flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Right pane skeleton */}
        <div className="loading-right flex-1 card space-y-5">
          <div className="loading-score flex flex-col items-center gap-2 py-4">
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="loading-meta flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="loading-section rounded-lg p-4 space-y-2 bg-surface-raised">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
