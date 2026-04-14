import { createClient } from "@/utils/supabase/server";
import type { RawEmail } from "@/types/email";

export async function getRawEmailById(id: string, userId: string) {
  const supabase = await createClient();

  return supabase
    .from("raw_emails")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .single();
}

export async function storeRawEmail(
  email: Omit<RawEmail, "id" | "created_at"> & { user_id: string }
) {
  const supabase = await createClient();

  return supabase
    .from("raw_emails")
    .insert(email)
    .select("id")
    .single();
}

export async function emailExists(gmailMessageId: string, userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("raw_emails")
    .select("id")
    .eq("gmail_message_id", gmailMessageId)
    .eq("user_id", userId)
    .maybeSingle();

  return data !== null;
}
