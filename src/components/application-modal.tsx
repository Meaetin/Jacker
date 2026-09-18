"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import type { Application, ApplicationStatus, ApplicationWithSource } from "@/types/application";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusChange } from "@/components/status-change";
import { ConfidenceBar } from "@/components/confidence-bar";
import { EmailSource } from "@/components/email-source";
import { ApplicationForm } from "@/components/application-form";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date";

interface ApplicationModalProps {
  application: Application | null;
  open: boolean;
  isDemo?: boolean;
  onClose: () => void;
  onEdited: (updated: Application) => void;
  onStatusChanged: (id: string, status: ApplicationStatus) => void;
  onDeleted: (id: string) => void;
}

export function ApplicationModal({
  application,
  open,
  isDemo = false,
  onClose,
  onEdited,
  onStatusChanged,
  onDeleted,
}: ApplicationModalProps) {
  const [detail, setDetail] = useState<ApplicationWithSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const id = application?.id ?? null;

  // Fetch full detail (incl. email body) whenever a different application opens.
  useEffect(() => {
    if (!open || !id) return;
    setEditing(false);
    setDetail(null);
    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/applications/${id}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApplicationWithSource | null) => {
        if (data) setDetail(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, id]);

  if (!application) return null;

  // Header reads from the list prop instantly; body fields prefer the fetched
  // detail but fall back to the list row so nothing flashes empty.
  const view = detail ?? application;

  async function handleDeleteConfirm() {
    if (!id) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(id);
      setConfirmingDelete(false);
      onClose();
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        contentClassName="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="application-modal-content space-y-6">
          <div className="application-modal-header flex items-start justify-between gap-4">
            <div className="application-modal-heading min-w-0">
              <h2 className="application-modal-company font-display text-xl font-bold text-text-primary truncate">
                {view.company ?? "Unknown Company"}
              </h2>
              <p className="application-modal-role text-text-secondary truncate">
                {view.role ?? "Unknown Role"}
              </p>
            </div>
            {!editing && (
              <div className="application-modal-actions flex items-center gap-3 flex-shrink-0">
                <StatusChange
                  applicationId={application.id}
                  currentStatus={view.status}
                  onChanged={(status) => onStatusChanged(application.id, status)}
                />
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil size={14} className="mr-1.5" />
                  Edit
                </Button>
                {!isDemo && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <ApplicationForm
              application={view}
              onSuccess={(updated) => {
                onEdited(updated);
                setEditing(false);
                onClose();
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="application-modal-fields space-y-4">
                {/* Once you've set the status yourself, the parser's confidence
                    in its own guess is no longer what you want to see. */}
                {view.status_source === "manual" ? (
                  <div className="application-modal-field">
                    <p className="text-sm text-text-secondary">Status</p>
                    <p className="application-modal-status-source text-text-primary">
                      Set by you
                      <span className="application-modal-status-source-note text-text-muted">
                        {" — a later email can still update it"}
                      </span>
                    </p>
                  </div>
                ) : (
                  view.status_confidence !== null && (
                    <div className="application-modal-field">
                      <p className="text-sm text-text-secondary">Confidence</p>
                      <ConfidenceBar confidence={view.status_confidence} />
                    </div>
                  )
                )}

                {view.interview_date && (
                  <div className="application-modal-field">
                    <p className="text-sm text-text-secondary">Interview Date</p>
                    <p className="text-text-primary">
                      {formatDate(view.interview_date)}
                      {view.interview_time && ` at ${view.interview_time}`}
                    </p>
                  </div>
                )}

                {view.location && (
                  <div className="application-modal-field">
                    <p className="text-sm text-text-secondary">Location</p>
                    <p className="text-text-primary">{view.location}</p>
                  </div>
                )}

                {view.notes && (
                  <div className="application-modal-field">
                    <p className="text-sm text-text-secondary">Notes</p>
                    <p className="text-text-primary whitespace-pre-wrap">{view.notes}</p>
                  </div>
                )}

                <div className="application-modal-timestamps flex gap-4 text-xs text-text-muted">
                  <span>Created: {formatDate(view.created_at)}</span>
                  <span>
                    Last updated: {formatDate(view.application_updated_at ?? view.updated_at)}
                  </span>
                </div>
              </div>

              {loading && !detail ? (
                <div className="application-modal-email-loading space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                detail && (
                  <EmailSource
                    subject={detail.email_subject}
                    from={detail.email_from}
                    receivedAt={detail.created_at}
                    snippet={detail.email_snippet}
                    bodyHtml={detail.email_body_html}
                    bodyText={detail.email_body_text}
                    gmailMessageId={detail.gmail_message_id}
                  />
                )
              )}
            </>
          )}
        </div>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmingDelete}
        application={application}
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmingDelete(false)}
      />
    </>
  );
}
