create table user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  emails_retrieved integer not null default 0,
  emails_scanned integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_user_usage_user_id on user_usage(user_id);
create index idx_user_usage_created_at on user_usage(created_at);
