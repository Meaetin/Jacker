"use client";

interface ViewToggleProps {
  view: "table" | "kanban";
  onViewChange: (view: "table" | "kanban") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="view-toggle inline-flex rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => onViewChange("table")}
        className={`view-toggle-table px-3 py-1.5 text-sm font-medium transition-colors ${
          view !== "kanban"
            ? "bg-brand text-white"
            : "bg-surface text-text-secondary hover:bg-surface-raised"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="6.5" width="14" height="2.5" rx="0.5" />
            <rect x="1" y="11" width="14" height="2.5" rx="0.5" />
          </svg>
          Table
        </span>
      </button>
      <button
        onClick={() => onViewChange("kanban")}
        className={`view-toggle-kanban px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
          view === "kanban"
            ? "bg-brand text-white"
            : "bg-surface text-text-secondary hover:bg-surface-raised"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="4" height="14" rx="0.5" />
            <rect x="6" y="1" width="4" height="14" rx="0.5" />
            <rect x="11" y="1" width="4" height="14" rx="0.5" />
          </svg>
          Kanban
        </span>
      </button>
    </div>
  );
}
