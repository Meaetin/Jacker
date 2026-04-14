create table parse_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_email_id uuid references raw_emails(id) on delete cascade,
  model_name text,
  prompt_version text,
  raw_response jsonb,
  parsed_success boolean,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_parse_logs_user_id on parse_logs(user_id);
create index idx_parse_logs_raw_email_id on parse_logs(raw_email_id);
