create policy "Users can update own emails" on raw_emails
  for update using (auth.uid() = user_id);
