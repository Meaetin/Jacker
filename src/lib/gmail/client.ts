import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { GMAIL_REDIRECT_URI } from "@/lib/config";
import { createAdminClient } from "@/utils/supabase/admin";

export function createGmailClient(
  accessToken: string,
  refreshToken: string,
  userId: string
): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // googleapis mints a fresh access token in memory whenever the current one
  // expires. Writing it back means the next run starts with a usable token
  // instead of paying for another refresh round-trip.
  oauth2Client.on("tokens", (tokens) => {
    if (!tokens.access_token) return;

    void createAdminClient()
      .from("user_tokens")
      .update({
        gmail_access_token: tokens.access_token,
        token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) {
          console.error("[gmail] Could not persist refreshed access token:", error);
        }
      });
  });

  return oauth2Client;
}
