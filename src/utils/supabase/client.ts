import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Keep the Realtime socket authenticated with the user's access token.
  // Without this, RLS-protected channels silently receive zero events.
  client.auth.getSession().then(({ data }) => {
    client!.realtime.setAuth(data.session?.access_token ?? null);
  });
  client.auth.onAuthStateChange((_event, session) => {
    client!.realtime.setAuth(session?.access_token ?? null);
  });

  return client;
}
