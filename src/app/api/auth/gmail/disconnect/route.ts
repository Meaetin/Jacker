import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: tokens } = await admin
    .from("user_tokens")
    .select("gmail_refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  // Ask Google to drop the grant, but never let a failure here stop the delete
  // below: a token Google has already invalidated would otherwise be stuck in
  // our table forever, leaving the user unable to reconnect.
  if (tokens?.gmail_refresh_token) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: tokens.gmail_refresh_token }),
      });
      if (!response.ok) {
        console.error(`[auth] Google revocation returned ${response.status}`);
      }
    } catch (error) {
      console.error("[auth] Google revocation request failed:", error);
    }
  }

  const { error } = await admin
    .from("user_tokens")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("[auth] Failed to delete Gmail tokens:", error);
    return NextResponse.json(
      { error: "Could not disconnect Gmail" },
      { status: 500 }
    );
  }

  return NextResponse.json({ disconnected: true });
}
