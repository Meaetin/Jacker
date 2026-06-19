import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { HistoryItem } from "./history-item";
import type { JobFitAnalysis } from "@/types/profile";

interface HistorySidebarProps {
  analyses: JobFitAnalysis[];
  selectedId: string | null;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
}

// Build a compact page list with ellipsis gaps: 1 … 4 5 6 … 10
function buildPageRange(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function HistorySidebar({
  analyses,
  selectedId,
  total,
  page,
  pageSize,
  onPageChange,
  onSelect,
  onNewAnalysis,
}: HistorySidebarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRange = buildPageRange(page, totalPages);

  return (
    <div className="history-sidebar flex flex-col">
      <div className="history-sidebar-header flex items-center justify-between gap-2 mb-3">
        <div className="history-sidebar-title-row flex items-center gap-2">
          <h2 className="history-sidebar-title text-lg font-semibold text-text-primary">
            History
          </h2>
          <span className="history-sidebar-count badge bg-surface-raised text-text-secondary text-xs">
            {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="history-new-button inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand bg-brand-light transition-colors hover:bg-brand/15 cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      <div className="history-sidebar-list space-y-1.5">
        {analyses.map((analysis) => (
          <HistoryItem
            key={analysis.id}
            analysis={analysis}
            isSelected={analysis.id === selectedId}
            onSelect={() => onSelect(analysis.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="history-pagination flex items-center justify-center gap-1.5 pt-4">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="history-page-prev inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageRange.map((entry, index) =>
            entry === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="history-page-ellipsis inline-flex h-8 w-8 items-center justify-center text-text-muted text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onPageChange(entry)}
                className={`history-page-button inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  entry === page
                    ? "history-page-active bg-brand text-white"
                    : "bg-surface-raised text-text-secondary hover:bg-brand-light hover:text-brand"
                }`}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="history-page-next inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-light hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
