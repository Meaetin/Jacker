-- People often apply by emailing a company directly, and that sent email is the
-- application itself. Gmail's search already returned those messages, but the
-- recipient was never captured — and for sent mail the company appears only in
-- the To header, since the From is the user.
--
-- `direction` is stored rather than re-derived so runReparsePipeline can work
-- from raw_emails alone, without going back to Gmail.

alter table raw_emails
  add column to_email text,
  add column to_name text,
  add column direction text not null default 'received'
    check (direction in ('sent', 'received'));

-- Existing rows keep the 'received' default: every email ingested before this
-- was treated as inbound, which is what the parser assumed at the time.

create index idx_raw_emails_direction on raw_emails (user_id, direction);
