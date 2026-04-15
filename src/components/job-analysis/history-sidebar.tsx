import { Plus } from "lucide-react";
import { HistoryItem } from "./history-item";
import type { JobFitAnalysis } from "@/types/profile";

interface HistorySidebarProps {
  analyses: JobFitAnalysis[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
}

export function HistorySidebar({
  analyses,
  selectedId,
  onSelect,
  onNewAnalysis,
}: HistorySidebarProps) {
  return (
    <div className="history-sidebar flex flex-col">
      <div className="history-sidebar-header flex items-center justify-between gap-2 mb-3">
        <div className="history-sidebar-title-row flex items-center gap-2">
          <h2 className="history-sidebar-title text-lg font-semibold text-text-primary">
            History
          </h2>
          <span className="history-sidebar-count badge bg-surface-raised text-text-secondary text-xs">
            {analyses.length}
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

      <div className="history-sidebar-list space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {analyses.map((analysis) => (
          <HistoryItem
            key={analysis.id}
            analysis={analysis}
            isSelected={analysis.id === selectedId}
            onSelect={() => onSelect(analysis.id)}
          />
        ))}
      </div>
    </div>
  );
}
