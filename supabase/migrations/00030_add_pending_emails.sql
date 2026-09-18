-- A capped ingest run leaves behind emails it did not reach. Recording how many
-- lets the dashboard resume a backlog the user walked away from, instead of
-- waiting for the daily cron to drain it a hundred at a time.
--
-- It lives on user_tokens rather than sync_jobs because the cron runs the
-- pipeline without creating a job row, and this count has to stay true whichever
-- path did the work.

alter table user_tokens
  add column pending_emails integer not null default 0;
