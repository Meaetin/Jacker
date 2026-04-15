"use client";

import { ScoreRing } from "./score-ring";
import type { JobFitAnalysis } from "@/types/profile";

interface HistoryItemProps {
  analysis: JobFitAnalysis;
  isSelected: boolean;
  onSelect: () => void;
}

export function HistoryItem({ analysis, isSelected, onSelect }: HistoryItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`history-item w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 cursor-pointer ${
        isSelected
          ? "history-item-selected bg-brand-light border-l-[3px] border-l-brand shadow-soft"
          : "history-item-inactive border-border"
      }`}
    >
      <div className="history-item-score flex-shrink-0">
        <ScoreRing score={analysis.score} band={analysis.band} size="sm" />
      </div>
      <div className="history-item-details min-w-0">
        {(analysis.job_title || analysis.company_name) && (
          <p className="history-item-title text-sm font-medium text-text-primary truncate">
            {[analysis.job_title, analysis.company_name].filter(Boolean).join(" @ ")}
          </p>
        )}
        {!analysis.job_title && !analysis.company_name && (
          <p className="history-item-title text-sm font-medium text-text-secondary truncate">
            Untitled analysis
          </p>
        )}
        <span className="history-item-date text-xs text-text-muted" suppressHydrationWarning>
          {new Date(analysis.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}
