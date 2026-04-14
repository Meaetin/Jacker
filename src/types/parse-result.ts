export type EmailType =
  | "application_update"
  | "interview_invitation"
  | "rejection"
  | "offer"
  | "assessment"
  | "job_alert"
  | "application_viewed"
  | "recruiter_outreach"
  | "other";

export interface AIParseResult {
  is_job_related: boolean;
  company_from_subject: string | null;
  company_from_body: string | null;
  company_from_email: string | null;
  role: string | null;
  status: string | null;
  status_confidence: number | null;
  email_type: EmailType | null;
  interview_date: string | null;
  interview_time: string | null;
  location: string | null;
  notes: string | null;
}
