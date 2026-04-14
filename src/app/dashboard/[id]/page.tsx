import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getApplicationById } from "@/lib/db/applications";
import { StatusBadge } from "@/components/status-badge";
import { ConfidenceBar } from "@/components/confidence-bar";
import { EmailSource } from "@/components/email-source";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const application = await getApplicationById(id, user!.id);
  if (!application) notFound();

  return (
    <div className="application-detail max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-text-secondary hover:text-brand"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {application.company ?? "Unknown Company"}
            </h1>
            <p className="text-text-secondary">{application.role ?? "Unknown Role"}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            <Link href={`/dashboard/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          </div>
        </div>

        <div className="detail-fields mt-6 space-y-4">
          {application.status_confidence !== null && (
            <div>
              <p className="text-sm text-text-secondary">Confidence</p>
              <ConfidenceBar confidence={application.status_confidence} />
            </div>
          )}

          {application.interview_date && (
            <div>
              <p className="text-sm text-text-secondary">Interview Date</p>
              <p className="text-text-primary">
                {formatDate(application.interview_date)}
                {application.interview_time && ` at ${application.interview_time}`}
              </p>
            </div>
          )}

          {application.location && (
            <div>
              <p className="text-sm text-text-secondary">Location</p>
              <p className="text-text-primary">{application.location}</p>
            </div>
          )}

          {application.notes && (
            <div>
              <p className="text-sm text-text-secondary">Notes</p>
              <p className="text-text-primary">{application.notes}</p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-text-muted">
            <span>Created: {formatDate(application.created_at)}</span>
            <span>Last updated: {formatDate(application.application_updated_at ?? application.updated_at)}</span>
          </div>
        </div>
      </div>

      <EmailSource
        subject={application.email_subject}
        from={application.email_from}
        receivedAt={application.created_at}
        snippet={application.email_snippet}
        gmailMessageId={application.gmail_message_id}
      />
    </div>
  );
}
