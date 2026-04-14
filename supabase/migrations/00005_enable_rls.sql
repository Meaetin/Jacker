alter table raw_emails enable row level security;
alter table applications enable row level security;
alter table parse_logs enable row level security;
alter table user_tokens enable row level security;

create policy "Users can read own emails" on raw_emails
  for select using (auth.uid() = user_id);

create policy "Users can insert own emails" on raw_emails
  for insert with check (auth.uid() = user_id);

create policy "Users can read own applications" on applications
  for select using (auth.uid() = user_id);

create policy "Users can insert own applications" on applications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own applications" on applications
  for update using (auth.uid() = user_id);

create policy "Users can read own parse logs" on parse_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own parse logs" on parse_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can manage own tokens" on user_tokens
  for all using (auth.uid() = user_id);
