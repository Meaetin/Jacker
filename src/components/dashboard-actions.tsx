"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LoaderCircle, X, Mail } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSyncJob, type SyncJob } from "@/hooks/use-sync-job";
import { formatRelativeTime, formatTimestamp, formatDate } from "@/utils/date";

interface DashboardActionsProps {
  gmailConnected: boolean;
  isDemo?: boolean;
  userId?: string;
  lastSyncAt?: string | null;
}

interface ReparseResult {
  total: number;
  parsed: number;
  skipped: number;
  newApplications: number;
  errors: string[];
  duration?: string;
}

export function DashboardActions({ gmailConnected, isDemo = false, userId, lastSyncAt = null }: DashboardActionsProps) {
  const job = useSyncJob(userId);
  // After a sync finishes this session, reflect its time without a refresh.
  const effectiveLastSync =
    job?.status === "done" && job.finished_at ? job.finished_at : lastSyncAt;
  // "starting" bridges the gap between clicking Sync and the job row arriving
  // over Realtime; after that the job's status drives the spinner.
  const [starting, setStarting] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncDone, setSyncDone] = useState<SyncJob | null>(null);
  const [reparseResult, setReparseResult] = useState<ReparseResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reparseError, setReparseError] = useState<string | null>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handledJobRef = useRef<string | null>(null);

  const syncing = starting || job?.status === "running";
  const busy = syncing || reparsing;

  const syncLabel =
    job?.status === "running" && job.total > 0
      ? `Parsing ${job.processed}/${job.total}…`
      : syncing
        ? "Syncing…"
        : reparsing
          ? "Parsing…"
          : "Sync";

  // Surface a toast once when a job finishes (done or error).
  useEffect(() => {
    if (!job || job.status === "running") return;
    const key = `${job.id}:${job.status}`;
    if (handledJobRef.current === key) return;
    handledJobRef.current = key;
    setStarting(false);
    if (job.status === "error") {
      setSyncError(job.error || "Sync failed");
    } else {
      setSyncDone(job);
    }
  }, [job]);

  useEffect(() => {
    if (!syncDone && !reparseResult && !syncError && !reparseError) return;
    const timer = setTimeout(() => {
      setSyncDone(null);
      setReparseResult(null);
      setSyncError(null);
      setReparseError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [syncDone, reparseResult, syncError, reparseError]);

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
    setStarting(true);
    setDropdownOpen(false);
    setSyncDone(null);
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

      // The request resolves only when the pipeline finishes. Build a final
      // snapshot from the response so the toast works even if Realtime is down,
      // and mark it handled so the Realtime "done" event doesn't double-toast.
      const doneJob: SyncJob = {
        id: data.jobId ?? "local",
        status: "done",
        total: data.fetched ?? 0,
        processed: data.fetched ?? 0,
        new_applications: data.newApplications ?? 0,
        updated_applications: data.updatedApplications ?? 0,
        error: null,
        started_at: "",
        finished_at: null,
      };
      handledJobRef.current = `${doneJob.id}:done`;
      setSyncDone(doneJob);
    } catch {
      setSyncError("Network error — check your connection and try again");
    } finally {
      setStarting(false);
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

      // New/updated applications stream in via Realtime — no refresh needed.
      setReparseResult(data);
    } catch {
      setReparseError("Network error — check your connection and try again");
    } finally {
      setReparsing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setDisconnectError(null);

    try {
      const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setDisconnectError(data.error || "Could not disconnect Gmail");
        return;
      }

      setConfirmingDisconnect(false);
      // gmailConnected is computed by the server component, so re-render it.
      router.refresh();
    } catch {
      setDisconnectError("Network error — check your connection and try again");
    } finally {
      setDisconnecting(false);
    }
  }

  function dismissResult() {
    setSyncDone(null);
    setReparseResult(null);
    setSyncError(null);
    setReparseError(null);
  }

  if (!gmailConnected) {
    return (
      <div className="gmail-connect-prompt card text-center py-12">
        <div className="gmail-connect-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
          <Mail className="gmail-connect-mail-icon h-6 w-6 text-brand" />
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

  if (isDemo) {
    return null;
  }

  return (
    <div className="sync-actions flex flex-col gap-2">
      <div className="sync-controls flex items-center gap-3">
        {!syncing && (
          <span
            className="sync-last-synced text-xs text-text-muted"
            title={effectiveLastSync ? `Last synced ${formatTimestamp(effectiveLastSync)}` : undefined}
          >
            Last synced: {formatRelativeTime(effectiveLastSync)}
          </span>
        )}
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
          {syncLabel}
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
              <p className="sync-date-hint text-xs text-text-muted">
                {effectiveLastSync
                  ? `Leave empty to sync from last sync (${formatDate(effectiveLastSync)}).`
                  : "Leave empty to sync the last 30 days."}
              </p>
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
            <div className="gmail-disconnect-section mt-3 border-t border-border pt-3">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setDisconnectError(null);
                  setConfirmingDisconnect(true);
                }}
                className="gmail-disconnect-button w-full text-sm text-status-rejected hover:underline"
              >
                Disconnect Gmail
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {(syncDone || syncError || reparseResult || reparseError) && (
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

          {syncDone && !syncError && (
            <div className="sync-success-toast flex items-start gap-2 rounded-lg bg-brand-light border border-brand/20 text-sm p-3">
              <div className="sync-toast-body flex-1">
                <p className="font-medium text-brand">Sync complete</p>
                <p className="text-brand/80">
                  {syncDone.processed} processed
                  {syncDone.new_applications > 0 && ` — ${syncDone.new_applications} new application${syncDone.new_applications !== 1 ? "s" : ""}`}
                  {syncDone.updated_applications > 0 && `, ${syncDone.updated_applications} updated`}
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

      <Dialog
        open={confirmingDisconnect}
        onClose={() => setConfirmingDisconnect(false)}
        contentClassName="max-w-md"
      >
        <div className="gmail-disconnect-content space-y-4">
          <h3 className="gmail-disconnect-title font-display text-lg font-semibold text-text-primary">
            Disconnect Gmail
          </h3>
          <p className="gmail-disconnect-warning text-sm text-text-secondary">
            Jacker will stop reading your inbox, and its access will be revoked
            at Google. Applications you have already tracked stay exactly as
            they are. You can reconnect whenever you like.
          </p>
          {disconnectError && (
            <p className="gmail-disconnect-error text-sm text-status-rejected">
              {disconnectError}
            </p>
          )}
          <div className="gmail-disconnect-actions flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingDisconnect(false)}
            >
              Cancel
            </Button>
            <button
              type="button"
              className="btn-danger"
              disabled={disconnecting}
              onClick={handleDisconnect}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
