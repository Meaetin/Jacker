import { createClient } from "@/utils/supabase/server";

interface UserUsageEntry {
  user_id: string;
  input_tokens: number;
  output_tokens: number;
  emails_retrieved: number;
  emails_scanned: number;
}

export async function insertUserUsage(entry: UserUsageEntry) {
  const supabase = await createClient();
  return supabase.from("user_usage").insert(entry);
}
