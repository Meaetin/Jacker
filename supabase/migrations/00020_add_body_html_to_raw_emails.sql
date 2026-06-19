-- Store the original HTML email body so the dashboard modal can render the
-- full message. Nullable: rows ingested before this migration stay NULL and
-- the UI falls back to body_text (plain) until they are re-ingested.
alter table raw_emails add column if not exists body_html text;
