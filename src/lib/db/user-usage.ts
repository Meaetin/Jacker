import { createClient } from "@/utils/supabase/server";

// --- Per-action-type field definitions ---

interface EmailParseUsage {
  input_tokens: number;
  output_tokens: number;
  emails_retrieved: number;
  emails_scanned: number;
}

interface ReparseUsage {
  input_tokens: number;
  output_tokens: number;
  emails_scanned: number;
}

interface CvToProfileUsage {
  input_tokens: number;
  output_tokens: number;
}

interface JobAnalysisUsage {
  input_tokens: number;
  output_tokens: number;
}

interface DocumentGenerationUsage {
  input_tokens: number;
  output_tokens: number;
}

interface JobExtractionUsage {
  input_tokens: number;
  output_tokens: number;
}

interface ChatMessageUsage {
  input_tokens: number;
  output_tokens: number;
}

// --- Discriminated union for type-safe calls ---

type UsageEntry =
  | ({ action: "email_parse"; user_id: string } & EmailParseUsage)
  | ({ action: "reparse"; user_id: string } & ReparseUsage)
  | ({ action: "cv_to_profile"; user_id: string } & CvToProfileUsage)
  | ({ action: "job_analysis"; user_id: string } & JobAnalysisUsage)
  | ({ action: "document_generation"; user_id: string } & DocumentGenerationUsage)
  | ({ action: "job_extraction"; user_id: string } & JobExtractionUsage)
  | ({ action: "chat_message"; user_id: string } & ChatMessageUsage);

function toRpcParams(entry: UsageEntry): Record<string, unknown> {
  const base = { p_user_id: entry.user_id };

  switch (entry.action) {
    case "email_parse":
      return {
        ...base,
        p_email_parse_input_tokens: entry.input_tokens,
        p_email_parse_output_tokens: entry.output_tokens,
        p_emails_retrieved: entry.emails_retrieved,
        p_emails_scanned: entry.emails_scanned,
      };
    case "reparse":
      return {
        ...base,
        p_reparse_input_tokens: entry.input_tokens,
        p_reparse_output_tokens: entry.output_tokens,
        p_reparse_emails_scanned: entry.emails_scanned,
      };
    case "cv_to_profile":
      return {
        ...base,
        p_cv_to_profile_input_tokens: entry.input_tokens,
        p_cv_to_profile_output_tokens: entry.output_tokens,
      };
    case "job_analysis":
      return {
        ...base,
        p_job_analysis_input_tokens: entry.input_tokens,
        p_job_analysis_output_tokens: entry.output_tokens,
      };
    case "document_generation":
      return {
        ...base,
        p_document_generation_input_tokens: entry.input_tokens,
        p_document_generation_output_tokens: entry.output_tokens,
      };
    case "job_extraction":
      return {
        ...base,
        p_job_extraction_input_tokens: entry.input_tokens,
        p_job_extraction_output_tokens: entry.output_tokens,
      };
    case "chat_message":
      return {
        ...base,
        p_chat_message_input_tokens: entry.input_tokens,
        p_chat_message_output_tokens: entry.output_tokens,
      };
  }
}

export async function trackUsage(entry: UsageEntry) {
  const supabase = await createClient();
  const params = toRpcParams(entry);
  return supabase.rpc("increment_user_usage", params);
}
