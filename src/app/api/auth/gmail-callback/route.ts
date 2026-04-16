import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/utils/supabase/server";
import { GMAIL_REDIRECT_URI } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=gmail_no_code", request.url)
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Exchange authorization code for tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      new URL("/dashboard?error=gmail_no_refresh_token", request.url)
    );
  }

  // Store tokens in user_tokens table
  const { error } = await supabase.from("user_tokens").upsert(
    {
      user_id: user.id,
      gmail_refresh_token: tokens.refresh_token,
      gmail_access_token: tokens.access_token ?? null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to store Gmail tokens:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=gmail_token_save_failed", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard?gmail=connected", request.url)
  );
}
