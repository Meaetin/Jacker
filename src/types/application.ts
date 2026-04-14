export const APPLICATION_STATUSES = [
  "applied",
  "interview",
  "assessment",
  "rejected",
  "offer",
  "unknown",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: string;
  user_id: string;
  company: string | null;
  role: string | null;
  status: ApplicationStatus;
  status_confidence: number | null;
  source_email_id: string | null;
  gmail_thread_id: string | null;
  interview_date: string | null;
  interview_time: string | null;
  location: string | null;
  notes: string | null;
  application_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithSource extends Application {
  email_subject: string | null;
  email_snippet: string | null;
  email_from: string | null;
  gmail_message_id: string | null;
}

export type EditableFields = Partial<
  Pick<
    Application,
    | "company"
    | "role"
    | "status"
    | "interview_date"
    | "interview_time"
    | "location"
    | "notes"
  >
>;
