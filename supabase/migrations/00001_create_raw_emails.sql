create table raw_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_message_id text unique not null,
  gmail_thread_id text,
  subject text,
  from_email text,
  from_name text,
  received_at timestamptz,
  snippet text,
  body_text text,
  created_at timestamptz not null default now()
);

create unique index idx_raw_emails_gmail_message_id on raw_emails(gmail_message_id);
create index idx_raw_emails_user_id on raw_emails(user_id);
