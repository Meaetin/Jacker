"use client";

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
          className="input-field w-auto"
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

      <input
        className="input-field w-64"
        type="text"
        placeholder="Search by role or company..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
