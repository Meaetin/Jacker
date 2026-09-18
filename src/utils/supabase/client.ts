import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;
let realtimeAuth: Promise<void> | undefined;

export function createClient(): SupabaseClient {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  client.auth.onAuthStateChange((_event, session) => {
    void client!.realtime.setAuth(session?.access_token ?? null);
  });

  return client;
}

/**
 * Resolves once the Realtime socket is carrying the user's access token.
 *
 * Nothing may join a channel before this settles. The server builds a channel's
 * postgres_changes bindings at join time, so a channel that joins before the
 * socket is authenticated gets bindings with no user context — RLS then filters
 * every event away. There is no error and no retry; the subscription simply
 * never delivers anything, which looks exactly like Realtime being disabled.
 */
export function realtimeReady(): Promise<void> {
  const supabase = createClient();

  realtimeAuth ??= supabase.auth
    .getSession()
    .then(async ({ data }) => {
      const token = data.session?.access_token ?? null;
      await supabase.realtime.setAuth(token);

      // Never cache a result that left the socket anonymous — a later caller
      // should retry rather than reuse a promise that resolved to nothing.
      if (!token) realtimeAuth = undefined;
    })
    .catch((error) => {
      realtimeAuth = undefined;
      console.error("[realtime] Could not authenticate the socket:", error);
    });

  return realtimeAuth;
}
