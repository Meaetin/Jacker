import { formatDate } from "@/utils/date";

interface EmailSourceProps {
  subject: string | null;
  from: string | null;
  receivedAt: string | null;
  snippet: string | null;
  gmailMessageId?: string | null;
}

export function EmailSource({ subject, from, receivedAt, snippet, gmailMessageId }: EmailSourceProps) {
  const gmailUrl = gmailMessageId
    ? `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`
    : null;

  return (
    <div className="email-source card-raised mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary">
          Source Email
        </h3>
        {gmailUrl && (
          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="email-source-gmail-link text-xs text-brand hover:underline"
          >
            Open in Gmail
          </a>
        )}
      </div>
      <div className="space-y-1 text-sm">
        {subject && (
          <p className="email-source-subject text-text-primary">{subject}</p>
        )}
        {from && (
          <p className="email-source-from text-text-secondary">From: {from}</p>
        )}
        {receivedAt && (
          <p className="email-source-date text-text-muted">
            {formatDate(receivedAt)}
          </p>
        )}
        {snippet && (
          <p className="email-source-snippet text-text-secondary mt-2">
            {snippet}
          </p>
        )}
      </div>
    </div>
  );
}
