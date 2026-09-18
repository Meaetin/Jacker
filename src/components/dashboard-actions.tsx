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

interface DeleteResult {
  applications: number;
  rawEmails: number;
  parseLogs: number;
}

export function DashboardActions({ gmailConnected, isDemo = false, userId, lastSyncAt = null }: DashboardActionsProps) {
  const job = useSyncJob(userId);
  // After a sync finishes this session, reflect its time without a refresh.
  const effectiveLastSync =
    job?.status === "done" && job.finished_at ? job.finished_at : lastSyncAt;
  // "starting" bridges the gap between clicking Sync and the job row arriving
  // over Realtime; after that the job's status drives the spinner.
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncFromDate, setSyncFromDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncDone, setSyncDone] = useState<SyncJob | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handledJobRef = useRef<string | null>(null);

  const syncing = starting || job?.status === "running";
  const busy = syncing || deleting;

  const syncLabel =
    job?.status === "running" && job.total > 0
      ? `Parsing ${job.processed}/${job.total}…`
      : syncing
        ? "Syncing…"
        : deleting
          ? "Deleting…"
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
    if (!syncDone && !deleteResult && !syncError && !deleteError) return;
    const timer = setTimeout(() => {
      setSyncDone(null);
      setDeleteResult(null);
      setSyncError(null);
      setDeleteError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [syncDone, deleteResult, syncError, deleteError]);

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
    setNeedsReconnect(false);

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
        // A dead refresh token is only fixable by re-authorising, and there is
        // no other route to it: "Connect Gmail" renders only when no token row
        // exists, and a broken token still counts as connected.
        setNeedsReconnect(data.code === "gmail_auth");
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

  async function handleDeleteData() {
    setDeleting(true);
    setConfirmingDelete(false);
    setDeleteResult(null);
    setDeleteError(null);

    try {
      const res = await fetch("/api/data", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Could not delete your data");
        return;
      }

      setDeleteResult(data.deleted);
      // Applications are gone, so the list on screen is now wrong.
      router.refresh();
    } catch {
      setDeleteError("Network error — check your connection and try again");
    } finally {
      setDeleting(false);
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
    setDeleteResult(null);
    setSyncError(null);
    setDeleteError(null);
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
                onClick={() => {
                  setDropdownOpen(false);
                  setDeleteError(null);
                  setConfirmingDelete(true);
                }}
                className="delete-data-button btn-secondary text-sm w-full text-status-rejected"
              >
                Delete All Data
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

      {(syncDone || syncError || deleteResult || deleteError) && (
        <div className="sync-toast">
          {syncError && (
            <div className="sync-error-toast flex items-start gap-2 rounded-lg bg-red-50/60 border border-status-rejected/20 text-sm text-status-rejected p-3">
              <div className="sync-error-body flex-1">
                <p>Sync failed: {syncError}</p>
                {needsReconnect && (
                  <a
                    href="/api/auth/gmail"
                    className="gmail-reconnect-link mt-1 inline-flex font-medium underline"
                  >
                    Reconnect Gmail
                  </a>
                )}
              </div>
              <button onClick={dismissResult} className="sync-dismiss text-status-rejected/60 hover:text-status-rejected">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {deleteError && (
            <div className="delete-error-toast flex items-start gap-2 rounded-lg bg-red-50/60 border border-status-rejected/20 text-sm text-status-rejected p-3">
              <p className="flex-1">Delete failed: {deleteError}</p>
              <button onClick={dismissResult} className="delete-dismiss text-status-rejected/60 hover:text-status-rejected">
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

          {deleteResult && !deleteError && (
            <div className="delete-success-toast flex items-start gap-2 rounded-lg bg-brand-light border border-brand/20 text-sm p-3">
              <div className="delete-toast-body flex-1">
                <p className="font-medium text-brand">Data deleted</p>
                <p className="text-brand/80">
                  {deleteResult.applications} application{deleteResult.applications !== 1 ? "s" : ""},{" "}
                  {deleteResult.rawEmails} email{deleteResult.rawEmails !== 1 ? "s" : ""} removed. Sync to start fresh.
                </p>
              </div>
              <button onClick={dismissResult} className="delete-dismiss text-brand/40 hover:text-brand">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        contentClassName="max-w-md"
      >
        <div className="delete-data-content space-y-4">
          <h3 className="delete-data-title font-display text-lg font-semibold text-text-primary">
            Delete all data
          </h3>
          <p className="delete-data-warning text-sm text-text-secondary">
            This removes every tracked application, every stored email and every
            parse log. It cannot be undone, and anything you edited by hand goes
            with it.
          </p>
          <p className="delete-data-note text-sm text-text-secondary">
            Your Gmail connection stays. The next sync starts from scratch, so
            your mail can be read again from any date you choose.
          </p>
          {deleteError && (
            <p className="delete-data-error text-sm text-status-rejected">
              {deleteError}
            </p>
          )}
          <div className="delete-data-actions flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <button
              type="button"
              className="btn-danger"
              disabled={deleting}
              onClick={handleDeleteData}
            >
              {deleting ? "Deleting…" : "Delete everything"}
            </button>
          </div>
        </div>
      </Dialog>

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
