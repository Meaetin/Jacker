-- A Gmail refresh token grants long-lived read access to an entire mailbox, so
-- user_tokens is server-only: reachable with the service-role key and nothing
-- else. RLS stays enabled as a second layer, with no policy left to satisfy.

drop policy if exists "Users can manage own tokens" on user_tokens;

revoke all on user_tokens from anon, authenticated;
