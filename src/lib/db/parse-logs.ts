import { createClient } from "@/utils/supabase/server";

interface ParseLogEntry {
  user_id: string;
  raw_email_id: string;
  prompt_version: string;
  raw_response: unknown;
  parsed_success: boolean;
  error_message?: string | null;
}

export async function insertParseLog(entry: ParseLogEntry) {
  const supabase = await createClient();

  return supabase.from("parse_logs").insert(entry);
}

export async function getParseLogByEmailId(rawEmailId: string, userId: string) {
  const supabase = await createClient();

  return supabase
    .from("parse_logs")
    .select()
    .eq("raw_email_id", rawEmailId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}
