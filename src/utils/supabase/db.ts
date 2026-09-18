import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * A database handle for code that runs either inside a user's request or as a
 * trusted background job.
 *
 * Callers in a request pass nothing and get the cookie-bound client, so row
 * level security still applies. The ingest pipeline passes the service-role
 * client explicitly, because a cron run has no session for RLS to check — it
 * scopes every query by an explicit user id instead.
 */
export type Db = SupabaseClient;

export async function resolveDb(db?: Db): Promise<Db> {
  return db ?? (await createClient());
}
