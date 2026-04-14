create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text,
  role text,
  status text not null default 'unknown'
    check (status in ('applied','interview','assessment','rejected','offer','unknown')),
  status_confidence numeric,
  source_email_id uuid references raw_emails(id) on delete set null,
  gmail_thread_id text,
  interview_date date,
  interview_time text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_applications_status on applications(status);
create index idx_applications_created_at on applications(created_at desc);
create index idx_applications_user_id on applications(user_id);
create index idx_applications_thread_id on applications(gmail_thread_id);
create index idx_applications_company_role on applications(lower(company), lower(role));
