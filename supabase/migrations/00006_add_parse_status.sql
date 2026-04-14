alter table raw_emails
  add column parse_status text not null default 'pending'
  check (parse_status in ('pending', 'parsed', 'not_job_related', 'failed'));

alter table raw_emails
  add column parse_error text;

create index idx_raw_emails_parse_status on raw_emails(parse_status);
