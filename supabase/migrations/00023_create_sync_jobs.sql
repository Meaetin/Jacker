-- Tracks a running/finished email sync so the UI spinner + live progress
-- survive page refreshes and navigation (state lives in the DB, not React).
create table sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'done', 'error')),
  total int not null default 0,
  processed int not null default 0,
  new_applications int not null default 0,
  updated_applications int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_sync_jobs_user_status
  on sync_jobs (user_id, status, started_at desc);

alter table sync_jobs enable row level security;

create policy "read own sync jobs"
  on sync_jobs for select
  using (auth.uid() = user_id);

create policy "insert own sync jobs"
  on sync_jobs for insert
  with check (auth.uid() = user_id);

create policy "update own sync jobs"
  on sync_jobs for update
  using (auth.uid() = user_id);
