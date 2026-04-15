-- Add document_generation to the allowed action_type values
alter table user_usage
  drop constraint chk_user_usage_action_type;

alter table user_usage
  add constraint chk_user_usage_action_type
  check (action_type in (
    'email_parse', 'reparse', 'cv_to_profile', 'job_analysis',
    'document_generation'
  ));
