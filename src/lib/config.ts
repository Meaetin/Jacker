/**
 * Central runtime configuration.
 * NEXT_PUBLIC_SITE_URL is the single source of truth for the app's base URL.
 * All other URLs are derived from it.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const GMAIL_REDIRECT_URI = `${SITE_URL}/api/auth/gmail-callback`;
