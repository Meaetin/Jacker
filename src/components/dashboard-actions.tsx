"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DashboardActionsProps {
  gmailConnected: boolean;
}

interface SyncResult {
  fetched: number;
  newEmails: number;
  parsed: number;
  newApplications: number;
  updatedApplications: number;
  errors: string[];
  duration?: string;
}

interface ReparseResult {
  total: number;
  parsed: number;
  skipped: number;
  newApplications: number;
  errors: string[];
  duration?: string;
}

function Spinner() {
  return (
    <svg
      className="sync-spinner h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function DashboardActions({ gmailConnected }: DashboardActionsProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState("");
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [reparseResult, setReparseResult] = useState<ReparseResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reparseError, setReparseError] = useState<string | null>(null);

  const busy = syncing || reparsing;

  async function handleSync() {
    setSyncing(true);
    setSyncOptionsOpen(false);
    setSyncResult(null);
    setSyncError(null);

    try {
      const body: { fromDate?: string } = {};
      if (syncFromDate) body.fromDate = syncFromDate;

      const res = await fetch("/api/emails/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "Sync failed");
        return;
      }

      setSyncResult(data);
      router.refresh();
    } catch {
      setSyncError("Network error — check your connection and try again");
    } finally {
      setSyncing(false);
    }
  }

  async function handleReparse() {
    setReparsing(true);
    setReparseResult(null);
    setReparseError(null);

    try {
      const res = await fetch("/api/emails/reparse", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setReparseError(data.error || "Re-parse failed");
        return;
      }

      setReparseResult(data);
      if (data.newApplications > 0) {
        router.refresh();
      }
    } catch {
      setReparseError("Network error — check your connection and try again");
    } finally {
      setReparsing(false);
    }
  }

  if (!gmailConnected) {
    return (
      <div className="gmail-connect-prompt card text-center py-12">
        <div className="gmail-connect-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
          <svg
            className="h-6 w-6 text-brand"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          Connect your Gmail
        </h2>
        <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">
          Link your Gmail account so the tracker can find and parse job-related
          emails automatically.
        </p>
        <a href="/api/auth/gmail" className="btn-primary mt-6 inline-flex">
          Connect Gmail
        </a>
      </div>
    );
  }

  return (
    <div className="sync-actions flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="sync-dropdown-container relative">
          <Button
            onClick={() => {
              if (syncOptionsOpen) {
                handleSync();
              } else {
                setSyncOptionsOpen(true);
              }
            }}
            disabled={busy}
            className={syncing ? "opacity-60 cursor-not-allowed" : ""}
          >
            {syncing ? (
              <span className="sync-button-loading flex items-center gap-2">
                <Spinner />
                Syncing…
              </span>
            ) : syncOptionsOpen ? (
              "Start Sync"
            ) : (
              "Sync Emails"
            )}
          </Button>

          {syncOptionsOpen && !busy && (
            <div className="sync-options-dropdown absolute top-full left-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-10">
              <div className="sync-date-field flex flex-col gap-1">
                <label htmlFor="sync-from-date" className="text-xs font-medium text-text-secondary">
                  Sync from date
                </label>
                <input
                  id="sync-from-date"
                  type="date"
                  value={syncFromDate}
                  onChange={(e) => setSyncFromDate(e.target.value)}
                  className="sync-date-input rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <p className="sync-date-hint text-xs text-text-secondary">
                  Leave empty to sync since last sync
                </p>
              </div>
              <button
                className="sync-options-cancel mt-2 text-xs text-text-secondary hover:text-text-primary"
                onClick={() => setSyncOptionsOpen(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={handleReparse}
          disabled={busy}
          className={reparsing ? "opacity-60 cursor-not-allowed" : ""}
        >
          {reparsing ? (
            <span className="reparse-button-loading flex items-center gap-2">
              <Spinner />
              Parsing…
            </span>
          ) : (
            "Re-parse Stored Emails"
          )}
        </Button>

        {busy && (
          <span className="action-progress-hint text-sm text-text-secondary animate-pulse">
            {syncing
              ? "Fetching and parsing emails — this may take a moment"
              : "Re-parsing stored emails — this may take a moment"}
          </span>
        )}
      </div>

      {syncError && (
        <div className="sync-error-banner rounded-lg bg-red-50 border border-red-200 text-sm text-status-rejected p-3">
          Sync failed: {syncError}
        </div>
      )}

      {reparseError && (
        <div className="reparse-error-banner rounded-lg bg-red-50 border border-red-200 text-sm text-status-rejected p-3">
          Re-parse failed: {reparseError}
        </div>
      )}

      {syncResult && !syncError && (
        <div className="sync-result-banner rounded-lg bg-emerald-50 border border-emerald-200 text-sm p-3">
          <div className="sync-result-summary font-medium text-emerald-800">
            Sync complete{syncResult.duration ? ` in ${syncResult.duration}` : ""}
          </div>
          <div className="sync-result-details mt-1 text-emerald-700 space-y-0.5">
            <p>
              {syncResult.fetched} emails fetched, {syncResult.newEmails} new
            </p>
            {syncResult.parsed > 0 && (
              <p>{syncResult.parsed} parsed by AI</p>
            )}
            {syncResult.newApplications > 0 && (
              <p className="font-medium">
                {syncResult.newApplications} new application{syncResult.newApplications !== 1 ? "s" : ""} found
              </p>
            )}
            {syncResult.newEmails === 0 && (
              <p>No new emails since last sync</p>
            )}
          </div>
          {syncResult.errors.length > 0 && (
            <div className="sync-result-errors mt-2 pt-2 border-t border-emerald-200 text-amber-700">
              <p className="font-medium">
                {syncResult.errors.length} error{syncResult.errors.length !== 1 ? "s" : ""} occurred
              </p>
            </div>
          )}
        </div>
      )}

      {reparseResult && !reparseError && (
        <div className="reparse-result-banner rounded-lg bg-blue-50 border border-blue-200 text-sm p-3">
          <div className="reparse-result-summary font-medium text-blue-800">
            Re-parse complete{reparseResult.duration ? ` in ${reparseResult.duration}` : ""}
          </div>
          <div className="reparse-result-details mt-1 text-blue-700 space-y-0.5">
            <p>
              {reparseResult.total} stored emails, {reparseResult.parsed} parsed, {reparseResult.skipped} skipped
            </p>
            {reparseResult.newApplications > 0 && (
              <p className="font-medium">
                {reparseResult.newApplications} new application{reparseResult.newApplications !== 1 ? "s" : ""} found
              </p>
            )}
            {reparseResult.parsed === 0 && (
              <p>No emails to parse</p>
            )}
          </div>
          {reparseResult.errors.length > 0 && (
            <div className="reparse-result-errors mt-2 pt-2 border-t border-blue-200 text-amber-700">
              <p className="font-medium">
                {reparseResult.errors.length} error{reparseResult.errors.length !== 1 ? "s" : ""} occurred
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
