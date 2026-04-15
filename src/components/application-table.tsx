"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/types/application";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/utils/date";

type SortKey = "company" | "role" | "status" | "application_updated_at";

interface ApplicationTableProps {
  applications: Application[];
  onContextMenu?: (e: React.MouseEvent, applicationId: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <span className="sort-icon ml-1 text-text-secondary opacity-40">↕</span>;
  return <span className="sort-icon ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export function ApplicationTable({ applications, onContextMenu }: ApplicationTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("application_updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...applications].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "application_updated_at") {
      const aDate = a.application_updated_at ?? a.updated_at;
      const bDate = b.application_updated_at ?? b.updated_at;
      return mul * (new Date(aDate).getTime() - new Date(bDate).getTime());
    }
    return mul * (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
  });

  if (applications.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="empty-state-icon mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
        <p className="empty-state-title text-text-primary font-medium">No applications yet</p>
        <p className="empty-state-hint mt-1 text-sm text-text-secondary">
          Sync your emails or add applications manually to get started.
        </p>
      </div>
    );
  }

  const headerCell = (key: SortKey, label: string, className = "") => (
    <th className={`table-header-cell pb-3 pr-4 font-medium ${className}`}>
      <button
        onClick={() => handleSort(key)}
        className="sort-button inline-flex items-center gap-0.5 hover:text-text-primary transition-colors"
      >
        {label}
        <SortIcon active={sortKey === key} dir={sortDir} />
      </button>
    </th>
  );

  return (
    <div className="application-table-wrapper overflow-x-auto">
      <table className="application-table w-full">
        <thead>
          <tr className="table-header-row border-b border-border text-left text-sm text-text-secondary">
            {headerCell("company", "Company")}
            {headerCell("role", "Role")}
            {headerCell("status", "Status")}
            {headerCell("application_updated_at", "Last Updated")}
            <th className="table-header-cell pb-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => (
            <tr
              key={app.id}
              onClick={() => router.push(`/dashboard/${app.id}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(e, app.id);
              }}
              className="table-data-row cursor-pointer border-b border-border transition-colors"
            >
              <td className="table-data-cell py-3 pr-4">
                <span className="font-medium text-text-primary">
                  {app.company ?? "—"}
                </span>
              </td>
              <td className="table-data-cell py-3 pr-4 text-text-secondary">
                {app.role ?? "—"}
              </td>
              <td className="table-data-cell py-3 pr-4">
                <StatusBadge status={app.status} />
              </td>
              <td className="table-data-cell py-3 pr-4 text-text-secondary text-sm">
                {formatDate(app.application_updated_at ?? app.updated_at)}
              </td>
              <td className="table-data-cell py-3 text-text-secondary text-sm max-w-xs truncate">
                {app.notes ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
