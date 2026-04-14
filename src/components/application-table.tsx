"use client";

import { useState } from "react";
import Link from "next/link";
import type { Application } from "@/types/application";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/utils/date";

type SortKey = "company" | "role" | "status" | "application_updated_at";

interface ApplicationTableProps {
  applications: Application[];
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <span className="sort-icon ml-1 text-text-secondary opacity-40">↕</span>;
  return <span className="sort-icon ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
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
        <p className="text-text-secondary">No applications found.</p>
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
              className="table-data-row border-b border-border hover:bg-surface-raised transition-colors"
            >
              <td className="table-data-cell py-3 pr-4">
                <Link
                  href={`/dashboard/${app.id}`}
                  className="font-medium text-text-primary hover:text-brand"
                >
                  {app.company ?? "—"}
                </Link>
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
