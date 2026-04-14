-- Make email-specific fields nullable (they only apply to email pipelines)
alter table user_usage
  alter column emails_retrieved drop not null,
  alter column emails_retrieved set default null,
  alter column emails_scanned drop not null,
  alter column emails_scanned set default null;

-- Add action_type to distinguish between different AI features
alter table user_usage
  add column action_type text not null default 'email_parse';

alter table user_usage
  add constraint chk_user_usage_action_type
  check (action_type in ('email_parse', 'reparse', 'cv_to_profile', 'job_analysis'));

create index idx_user_usage_user_action on user_usage(user_id, action_type);

-- Enable RLS
alter table user_usage enable row level security;

create policy "Users can read own usage" on user_usage
  for select using (auth.uid() = user_id);

create policy "Users can insert own usage" on user_usage
  for insert with check (auth.uid() = user_id);
