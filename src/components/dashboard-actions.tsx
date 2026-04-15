"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LoaderCircle, X } from "lucide-react";

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

export function DashboardActions({ gmailConnected }: DashboardActionsProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [reparseResult, setReparseResult] = useState<ReparseResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reparseError, setReparseError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const busy = syncing || reparsing;

  useEffect(() => {
    if (!syncResult && !reparseResult && !syncError && !reparseError) return;
    const timer = setTimeout(() => {
      setSyncResult(null);
      setReparseResult(null);
      setSyncError(null);
      setReparseError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [syncResult, reparseResult, syncError, reparseError]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSync() {
    setSyncing(true);
    setDropdownOpen(false);
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
    setDropdownOpen(false);
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

  function dismissResult() {
    setSyncResult(null);
    setReparseResult(null);
    setSyncError(null);
    setReparseError(null);
  }

  if (!gmailConnected) {
    return (
      <div className="gmail-connect-prompt card text-center py-12">
        <div className="gmail-connect-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
          <svg className="h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
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
    <div className="sync-actions flex flex-col gap-2">
      <div ref={dropdownRef} className="sync-dropdown relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={busy}
          className="sync-toggle-button flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle className="sync-spinner h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="sync-icon h-4 w-4" />
          )}
          {syncing ? "Syncing…" : reparsing ? "Parsing…" : "Sync"}
        </button>

        {dropdownOpen && !busy && (
          <div className="sync-options-dropdown absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-3 shadow-soft-md z-10">
            <div className="sync-date-field flex flex-col gap-1 mb-3">
              <label htmlFor="sync-from-date" className="text-xs font-medium text-text-secondary">
                Sync from date
              </label>
              <input
                id="sync-from-date"
                type="date"
                value={syncFromDate}
                onChange={(e) => setSyncFromDate(e.target.value)}
                className="sync-date-input input-field text-sm"
              />
            </div>
            <div className="sync-action-buttons flex flex-col gap-2">
              <button
                onClick={handleSync}
                className="sync-start-button btn-primary text-sm w-full"
              >
                Sync Emails
              </button>
              <button
                onClick={handleReparse}
                className="reparse-start-button btn-secondary text-sm w-full"
              >
                Re-parse Stored Emails
              </button>
            </div>
          </div>
        )}
      </div>

      {(syncResult || syncError || reparseResult || reparseError) && (
        <div className="sync-toast">
          {syncError && (
            <div className="sync-error-toast flex items-start gap-2 rounded-lg bg-red-50/60 border border-status-rejected/20 text-sm text-status-rejected p-3">
              <p className="flex-1">Sync failed: {syncError}</p>
              <button onClick={dismissResult} className="sync-dismiss text-status-rejected/60 hover:text-status-rejected">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {reparseError && (
            <div className="reparse-error-toast flex items-start gap-2 rounded-lg bg-red-50/60 border border-status-rejected/20 text-sm text-status-rejected p-3">
              <p className="flex-1">Re-parse failed: {reparseError}</p>
              <button onClick={dismissResult} className="reparse-dismiss text-status-rejected/60 hover:text-status-rejected">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {syncResult && !syncError && (
            <div className="sync-success-toast flex items-start gap-2 rounded-lg bg-brand-light border border-brand/20 text-sm p-3">
              <div className="sync-toast-body flex-1">
                <p className="font-medium text-brand">
                  Sync complete{syncResult.duration ? ` in ${syncResult.duration}` : ""}
                </p>
                <p className="text-brand/80">
                  {syncResult.fetched} fetched, {syncResult.newEmails} new
                  {syncResult.newApplications > 0 && ` — ${syncResult.newApplications} new application${syncResult.newApplications !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={dismissResult} className="sync-dismiss text-brand/40 hover:text-brand">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {reparseResult && !reparseError && (
            <div className="reparse-success-toast flex items-start gap-2 rounded-lg bg-brand-light border border-brand/20 text-sm p-3">
              <div className="reparse-toast-body flex-1">
                <p className="font-medium text-brand">
                  Re-parse complete{reparseResult.duration ? ` in ${reparseResult.duration}` : ""}
                </p>
                <p className="text-brand/80">
                  {reparseResult.parsed} parsed, {reparseResult.skipped} skipped
                  {reparseResult.newApplications > 0 && ` — ${reparseResult.newApplications} new application${reparseResult.newApplications !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={dismissResult} className="reparse-dismiss text-brand/40 hover:text-brand">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
