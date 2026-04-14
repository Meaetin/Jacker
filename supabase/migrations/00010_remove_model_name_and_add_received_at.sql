alter table parse_logs drop column model_name;

alter table applications add column application_updated_at timestamptz;

update applications a
set application_updated_at = re.received_at
from raw_emails re
where a.source_email_id = re.id;

create index idx_applications_application_updated_at on applications(application_updated_at desc);
