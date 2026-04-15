create policy "Users can delete own applications" on applications
  for delete using (auth.uid() = user_id);
