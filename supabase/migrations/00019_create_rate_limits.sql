-- Persistent rate limits table: replaces the in-memory rate limiter that
-- broke under Vercel serverless (each invocation got a fresh empty Map).
-- One row per user tracks the current sliding window and active-request flag.

create table rate_limits (
  user_id            uuid        primary key references auth.users(id) on delete cascade,
  window_start       timestamptz not null default now(),
  request_count      integer     not null default 0,
  has_active_request boolean     not null default false,
  updated_at         timestamptz not null default now()
);

alter table rate_limits enable row level security;

-- Users can only see and manage their own row (service role bypasses RLS for RPCs).
create policy "Users can read own rate limit" on rate_limits
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- check_and_acquire_rate_limit
--
-- Atomically checks both guards and, if allowed, records the request:
--   1. Has an active request in flight?  → { allowed: false, reason: "active_request" }
--   2. Over the sliding-window limit?    → { allowed: false, reason: "rate_limit", retry_after_ms }
--   3. Otherwise increment count + set active flag and return { allowed: true }
--
-- The FOR UPDATE lock on the user's row makes the check-and-set atomic
-- across concurrent Vercel function instances.
-- ---------------------------------------------------------------------------
create or replace function check_and_acquire_rate_limit(
  p_user_id     uuid,
  p_window_ms   integer,
  p_max_requests integer
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_window_start       timestamptz;
  v_request_count      integer;
  v_has_active         boolean;
  v_now                timestamptz := now();
  v_window_duration    interval    := (p_window_ms || ' milliseconds')::interval;
  v_retry_after_ms     integer;
begin
  -- Lock this user's row for the duration of the transaction.
  select window_start, request_count, has_active_request
  into   v_window_start, v_request_count, v_has_active
  from   rate_limits
  where  user_id = p_user_id
  for update;

  if not found then
    -- First ever request for this user: insert and allow immediately.
    insert into rate_limits (user_id, window_start, request_count, has_active_request, updated_at)
    values (p_user_id, v_now, 1, true, v_now);
    return jsonb_build_object('allowed', true);
  end if;

  -- If the window has expired, reset the counter and active flag.
  if v_now - v_window_start >= v_window_duration then
    v_window_start  := v_now;
    v_request_count := 0;
    v_has_active    := false;
  end if;

  -- Guard 1: block if another request is already streaming.
  if v_has_active then
    return jsonb_build_object('allowed', false, 'reason', 'active_request');
  end if;

  -- Guard 2: sliding-window rate limit.
  if v_request_count >= p_max_requests then
    v_retry_after_ms := greatest(
      0,
      extract(epoch from (v_window_start + v_window_duration - v_now))::integer * 1000
    );
    return jsonb_build_object('allowed', false, 'reason', 'rate_limit', 'retry_after_ms', v_retry_after_ms);
  end if;

  -- Allowed: record the request.
  update rate_limits
  set    window_start       = v_window_start,
         request_count      = v_request_count + 1,
         has_active_request = true,
         updated_at         = v_now
  where  user_id = p_user_id;

  return jsonb_build_object('allowed', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- release_rate_limit_slot
--
-- Called when a streaming response finishes (or errors).
-- Clears has_active_request so the next request is not blocked.
-- ---------------------------------------------------------------------------
create or replace function release_rate_limit_slot(p_user_id uuid)
returns void
language sql
security definer
as $$
  update rate_limits
  set    has_active_request = false,
         updated_at         = now()
  where  user_id = p_user_id;
$$;
