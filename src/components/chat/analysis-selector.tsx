"use client";

import { Target } from "lucide-react";
import type { JobFitAnalysis } from "@/types/profile";

interface AnalysisSelectorProps {
  analyses: JobFitAnalysis[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function AnalysisSelector({ analyses, selectedId, onSelect }: AnalysisSelectorProps) {
  if (analyses.length === 0) {
    return (
      <div className="analysis-selector-empty flex items-center gap-2 text-xs text-text-muted">
        <Target className="h-3.5 w-3.5" />
        No job analyses yet
      </div>
    );
  }

  return (
    <div className="analysis-selector-wrapper flex items-center gap-2">
      <Target className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="analysis-selector-select rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-light max-w-[280px] truncate cursor-pointer"
      >
        <option value="">No job context</option>
        {analyses.map((a) => (
          <option key={a.id} value={a.id}>
            {[a.job_title, a.company_name].filter(Boolean).join(" @ ") || "Untitled analysis"}
          </option>
        ))}
      </select>
    </div>
  );
}
