-- Stream application + sync-job changes to the dashboard over Realtime.
alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table sync_jobs;

-- replica identity full ensures UPDATE/DELETE payloads carry the full old row
-- (including user_id) so the client can filter and remove rows correctly.
alter table applications replica identity full;
alter table sync_jobs replica identity full;
