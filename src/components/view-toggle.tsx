"use client";

import { List, Columns3 } from "lucide-react";

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
            : "toggle-inactive"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <List className="h-3.5 w-3.5" />
          Table
        </span>
      </button>
      <button
        onClick={() => onViewChange("kanban")}
        className={`view-toggle-kanban px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
          view === "kanban"
            ? "bg-brand text-white"
            : "toggle-inactive"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Columns3 className="h-3.5 w-3.5" />
          Kanban
        </span>
      </button>
    </div>
  );
}
