"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate } from "@/utils/date";

interface EmailSourceProps {
  subject: string | null;
  from: string | null;
  receivedAt: string | null;
  snippet: string | null;
  gmailMessageId?: string | null;
}

export function EmailSource({ subject, from, receivedAt, snippet, gmailMessageId }: EmailSourceProps) {
  const [expanded, setExpanded] = useState(false);

  const gmailUrl = gmailMessageId
    ? `https://mail.google.com/mail/u/0/#inbox/${gmailMessageId}`
    : null;

  const hasContent = subject || from || snippet;

  if (!hasContent) return null;

  return (
    <div className="email-source-section mt-6 rounded-lg border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="email-source-header flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-overlay"
      >
        <span className="email-source-title text-sm font-medium text-text-secondary">
          Source Email
        </span>
        <ChevronDown
          className={`email-source-chevron h-4 w-4 text-text-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="email-source-body border-t border-border px-4 py-3 space-y-1">
          {subject && (
            <p className="email-source-subject text-sm text-text-primary">{subject}</p>
          )}
          {from && (
            <p className="email-source-from text-sm text-text-secondary">From: {from}</p>
          )}
          {receivedAt && (
            <p className="email-source-date text-xs text-text-muted">
              {formatDate(receivedAt)}
            </p>
          )}
          {snippet && (
            <p className="email-source-snippet text-sm text-text-secondary mt-2">
              {snippet}
            </p>
          )}
          {gmailUrl && (
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="email-source-gmail-link inline-block mt-2 text-xs text-brand hover:underline"
            >
              Open in Gmail
            </a>
          )}
        </div>
      )}
    </div>
  );
}
