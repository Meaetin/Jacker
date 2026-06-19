create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  kanban_column_order text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_preferences_user_id on user_preferences(user_id);

alter table user_preferences enable row level security;

create policy "Users can read own preferences" on user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can insert own preferences" on user_preferences
  for insert with check (auth.uid() = user_id);

create policy "Users can update own preferences" on user_preferences
  for update using (auth.uid() = user_id);
