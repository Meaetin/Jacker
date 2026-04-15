"use client";

import { Search, X } from "lucide-react";
import { APPLICATION_STATUSES } from "@/types/application";

interface FilterBarProps {
  view?: string;
  status: string;
  search: string;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function FilterBar({ view, status, search, onStatusChange, onSearchChange }: FilterBarProps) {
  return (
    <div className="filter-bar flex flex-wrap gap-3 items-center">
      {view !== "kanban" && (
        <select
          className="filter-status-select input-field w-auto pr-8"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">All Statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      )}

      <div className="filter-search-wrapper relative w-64">
        <Search className="filter-search-icon absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        <input
          className="filter-search-input input-field w-full pl-8 pr-8"
          type="text"
          placeholder="Search by role or company..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="filter-search-clear absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
