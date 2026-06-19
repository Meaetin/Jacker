-- Aggregate stats for the dashboard chips. Must reflect ALL of a user's
-- applications (not just the loaded page), so it runs server-side in one
-- round-trip. security invoker keeps RLS enforced for the calling user.
create or replace function application_stats(p_user uuid)
returns table (
  status text,
  count bigint,
  upcoming_interviews bigint
)
language sql
stable
security invoker
as $$
  select
    a.status,
    count(*) as count,
    (
      select count(*)
      from applications b
      where b.user_id = p_user
        and b.interview_date >= current_date
    ) as upcoming_interviews
  from applications a
  where a.user_id = p_user
  group by a.status;
$$;
