export interface RawEmail {
  id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  subject: string | null;
  from_email: string | null;
  from_name: string | null;
  received_at: string | null;
  snippet: string | null;
  body_text: string | null;
  parse_status: "pending" | "parsed" | "not_job_related" | "failed";
  parse_error: string | null;
  created_at: string;
}

export interface GmailMessage {
  id: string;
  threadId: string | null;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: string;
}
