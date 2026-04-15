-- Refactor user_usage: one row per user with dedicated accumulating columns per action type

-- Step 1: Create new table
create table user_usage_new (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Email pipeline: email_parse
  email_parse_input_tokens  integer not null default 0,
  email_parse_output_tokens integer not null default 0,
  emails_retrieved          integer not null default 0,
  emails_scanned            integer not null default 0,

  -- Email pipeline: reparse
  reparse_input_tokens     integer not null default 0,
  reparse_output_tokens    integer not null default 0,
  reparse_emails_scanned   integer not null default 0,

  -- CV to profile
  cv_to_profile_input_tokens  integer not null default 0,
  cv_to_profile_output_tokens integer not null default 0,

  -- Job analysis
  job_analysis_input_tokens  integer not null default 0,
  job_analysis_output_tokens integer not null default 0,

  -- Document generation
  document_generation_input_tokens  integer not null default 0,
  document_generation_output_tokens integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 2: Aggregate existing data into single rows per user
insert into user_usage_new (
  user_id,
  email_parse_input_tokens, email_parse_output_tokens,
  emails_retrieved, emails_scanned,
  reparse_input_tokens, reparse_output_tokens, reparse_emails_scanned,
  cv_to_profile_input_tokens, cv_to_profile_output_tokens,
  job_analysis_input_tokens, job_analysis_output_tokens,
  document_generation_input_tokens, document_generation_output_tokens,
  created_at, updated_at
)
select
  user_id,
  coalesce(sum(case when action_type = 'email_parse' then input_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'email_parse' then output_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'email_parse' then coalesce(emails_retrieved, 0) else 0 end), 0),
  coalesce(sum(case when action_type = 'email_parse' then coalesce(emails_scanned, 0) else 0 end), 0),
  coalesce(sum(case when action_type = 'reparse' then input_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'reparse' then output_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'reparse' then coalesce(emails_scanned, 0) else 0 end), 0),
  coalesce(sum(case when action_type = 'cv_to_profile' then input_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'cv_to_profile' then output_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'job_analysis' then input_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'job_analysis' then output_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'document_generation' then input_tokens else 0 end), 0),
  coalesce(sum(case when action_type = 'document_generation' then output_tokens else 0 end), 0),
  min(created_at),
  max(created_at)
from user_usage
group by user_id;

-- Step 3: Swap tables
drop table user_usage;
alter table user_usage_new rename to user_usage;

-- Step 4: Recreate indexes
create index idx_user_usage_user_id on user_usage(user_id);

-- Step 5: Enable RLS
alter table user_usage enable row level security;

create policy "Users can read own usage" on user_usage
  for select using (auth.uid() = user_id);

create policy "Users can insert own usage" on user_usage
  for insert with check (auth.uid() = user_id);

create policy "Users can update own usage" on user_usage
  for update using (auth.uid() = user_id);

-- Step 6: Create RPC function for atomic increment
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
  p_document_generation_output_tokens integer default 0
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
    document_generation_input_tokens, document_generation_output_tokens
  ) values (
    p_user_id,
    p_email_parse_input_tokens, p_email_parse_output_tokens,
    p_emails_retrieved, p_emails_scanned,
    p_reparse_input_tokens, p_reparse_output_tokens, p_reparse_emails_scanned,
    p_cv_to_profile_input_tokens, p_cv_to_profile_output_tokens,
    p_job_analysis_input_tokens, p_job_analysis_output_tokens,
    p_document_generation_input_tokens, p_document_generation_output_tokens
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
    updated_at = now();
$$;
