import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { GMAIL_REDIRECT_URI } from "@/lib/config";

export function createGmailClient(accessToken: string, refreshToken: string): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}
