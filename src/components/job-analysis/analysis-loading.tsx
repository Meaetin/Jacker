import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisLoading() {
  return (
    <div className="analysis-loading space-y-5">
      {/* Score ring skeleton */}
      <div className="loading-score-ring flex flex-col items-center gap-2 py-4">
        <Skeleton className="loading-score-circle h-[120px] w-[120px] rounded-full" />
        <Skeleton className="loading-score-label h-4 w-20" />
      </div>

      {/* Metadata skeleton */}
      <div className="loading-meta flex flex-col items-center gap-2">
        <Skeleton className="loading-meta-title h-4 w-48" />
        <Skeleton className="loading-meta-url h-3 w-64" />
      </div>

      {/* Themed section skeletons */}
      {[
        { bg: "#edf5ed", label: "Strengths" },
        { bg: "#f8eded", label: "Gaps" },
        { bg: "#faf3e5", label: "Recommendations" },
        { bg: "#edf4f9", label: "Overall" },
      ].map((section) => (
        <div
          key={section.label}
          className="loading-section rounded-lg border-l-4 p-4 space-y-2"
          style={{ backgroundColor: section.bg, borderColor: "#e0d6ca" }}
        >
          <Skeleton className="loading-section-title h-4 w-24" />
          <Skeleton className="loading-section-line h-3 w-full" />
          <Skeleton className="loading-section-line h-3 w-5/6" />
          <Skeleton className="loading-section-line h-3 w-4/6" />
        </div>
      ))}
    </div>
  );
}
