-- Add job_extraction and chat_message columns to user_usage
alter table user_usage
  add column if not exists job_extraction_input_tokens  integer not null default 0,
  add column if not exists job_extraction_output_tokens integer not null default 0,
  add column if not exists chat_message_input_tokens    integer not null default 0,
  add column if not exists chat_message_output_tokens   integer not null default 0;

-- Update RPC function to support new action types
create or replace function increment_user_usage(
  p_user_id uuid,
  p_email_parse_input_tokens  integer default 0,
  p_email_parse_output_tokens integer default 0,
  p_emails_retrieved          integer default 0,
  p_emails_scanned            integer default 0,
  p_reparse_input_tokens      integer default 0,
  p_reparse_output_tokens     integer default 0,
  p_reparse_emails_scanned    integer default 0,
  p_cv_to_profile_input_tokens  integer default 0,
  p_cv_to_profile_output_tokens integer default 0,
  p_job_analysis_input_tokens  integer default 0,
  p_job_analysis_output_tokens integer default 0,
  p_document_generation_input_tokens  integer default 0,
  p_document_generation_output_tokens integer default 0,
  p_job_extraction_input_tokens  integer default 0,
  p_job_extraction_output_tokens integer default 0,
  p_chat_message_input_tokens    integer default 0,
  p_chat_message_output_tokens   integer default 0
)
returns void
language sql
security definer
as $$
  insert into user_usage (
    user_id,
    email_parse_input_tokens, email_parse_output_tokens,
    emails_retrieved, emails_scanned,
    reparse_input_tokens, reparse_output_tokens, reparse_emails_scanned,
    cv_to_profile_input_tokens, cv_to_profile_output_tokens,
    job_analysis_input_tokens, job_analysis_output_tokens,
    document_generation_input_tokens, document_generation_output_tokens,
    job_extraction_input_tokens, job_extraction_output_tokens,
    chat_message_input_tokens, chat_message_output_tokens
  ) values (
    p_user_id,
    p_email_parse_input_tokens, p_email_parse_output_tokens,
    p_emails_retrieved, p_emails_scanned,
    p_reparse_input_tokens, p_reparse_output_tokens, p_reparse_emails_scanned,
    p_cv_to_profile_input_tokens, p_cv_to_profile_output_tokens,
    p_job_analysis_input_tokens, p_job_analysis_output_tokens,
    p_document_generation_input_tokens, p_document_generation_output_tokens,
    p_job_extraction_input_tokens, p_job_extraction_output_tokens,
    p_chat_message_input_tokens, p_chat_message_output_tokens
  )
  on conflict (user_id) do update set
    email_parse_input_tokens  = user_usage.email_parse_input_tokens  + excluded.email_parse_input_tokens,
    email_parse_output_tokens = user_usage.email_parse_output_tokens + excluded.email_parse_output_tokens,
    emails_retrieved          = user_usage.emails_retrieved          + excluded.emails_retrieved,
    emails_scanned            = user_usage.emails_scanned            + excluded.emails_scanned,
    reparse_input_tokens      = user_usage.reparse_input_tokens      + excluded.reparse_input_tokens,
    reparse_output_tokens     = user_usage.reparse_output_tokens     + excluded.reparse_output_tokens,
    reparse_emails_scanned    = user_usage.reparse_emails_scanned    + excluded.reparse_emails_scanned,
    cv_to_profile_input_tokens  = user_usage.cv_to_profile_input_tokens  + excluded.cv_to_profile_input_tokens,
    cv_to_profile_output_tokens = user_usage.cv_to_profile_output_tokens + excluded.cv_to_profile_output_tokens,
    job_analysis_input_tokens  = user_usage.job_analysis_input_tokens  + excluded.job_analysis_input_tokens,
    job_analysis_output_tokens = user_usage.job_analysis_output_tokens + excluded.job_analysis_output_tokens,
    document_generation_input_tokens  = user_usage.document_generation_input_tokens  + excluded.document_generation_input_tokens,
    document_generation_output_tokens = user_usage.document_generation_output_tokens + excluded.document_generation_output_tokens,
    job_extraction_input_tokens  = user_usage.job_extraction_input_tokens  + excluded.job_extraction_input_tokens,
    job_extraction_output_tokens = user_usage.job_extraction_output_tokens + excluded.job_extraction_output_tokens,
    chat_message_input_tokens    = user_usage.chat_message_input_tokens    + excluded.chat_message_input_tokens,
    chat_message_output_tokens   = user_usage.chat_message_output_tokens   + excluded.chat_message_output_tokens,
    updated_at = now();
$$;
