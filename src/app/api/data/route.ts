import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isDemoUser } from "@/utils/demo";

/**
 * Wipes everything the tracker has learned for this user: applications, stored
 * emails and parse logs. The Gmail connection itself is left alone — this is
 * "start over", not "disconnect".
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Deleting data is disabled for demo accounts" },
      { status: 403 }
    );
  }

  // raw_emails and parse_logs have no delete policy, so this runs through the
  // service-role client. Every statement below is scoped by user_id explicitly —
  // that filter is the only thing standing in for RLS here.
  const admin = createAdminClient();

  // Applications first. source_email_id is `on delete set null`, so deleting the
  // emails would orphan these rows rather than remove them.
  const applications = await admin
    .from("applications")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (applications.error) {
    console.error(`[data] Failed to delete applications: ${applications.error.message}`);
    return NextResponse.json({ error: applications.error.message }, { status: 500 });
  }

  // parse_logs cascade from raw_emails, but only those that still point at one.
  // Deleting by user_id catches the rest too.
  const parseLogs = await admin
    .from("parse_logs")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (parseLogs.error) {
    console.error(`[data] Failed to delete parse logs: ${parseLogs.error.message}`);
    return NextResponse.json({ error: parseLogs.error.message }, { status: 500 });
  }

  const rawEmails = await admin
    .from("raw_emails")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (rawEmails.error) {
    console.error(`[data] Failed to delete raw emails: ${rawEmails.error.message}`);
    return NextResponse.json({ error: rawEmails.error.message }, { status: 500 });
  }

  // Clear the watermark. Without this the next sync only searches for mail newer
  // than the data just deleted, so none of it would come back.
  const { error: watermarkError } = await admin
    .from("user_tokens")
    .update({ last_sync_at: null })
    .eq("user_id", user.id);

  if (watermarkError) {
    console.error(`[data] Failed to reset last_sync_at: ${watermarkError.message}`);
    return NextResponse.json({ error: watermarkError.message }, { status: 500 });
  }

  const deleted = {
    applications: applications.data?.length ?? 0,
    parseLogs: parseLogs.data?.length ?? 0,
    rawEmails: rawEmails.data?.length ?? 0,
  };

  console.log(
    `[data] Deleted all data for user ${user.id} — ${deleted.applications} applications, ${deleted.rawEmails} emails, ${deleted.parseLogs} parse logs`
  );

  return NextResponse.json({ deleted });
}
