import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { GmailMessage } from "@/types/email";
import { parseGmailMessage } from "./parse-raw";
import { createClient } from "@/utils/supabase/server";

const BASE_QUERY = `(application OR applying OR thanks OR "thank you for applying" OR "regret to inform" OR "move forward with other candidates" OR offer OR assessment OR shortlisted OR interview) -category:promotions -category:social`;

const PAGE_SIZE = 50;

export async function fetchRecentEmails(
  auth: OAuth2Client,
  maxResults = 200,
  afterDate?: Date,
  userId?: string
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: "v1", auth });

  let query: string;
  if (afterDate) {
    // Subtract 1 day to account for UTC vs user's local timezone.
    // e.g. user picks 31 Mar SGT (UTC+8), but after:2026/03/31 means
    // "after 31 Mar 00:00 UTC" = "after 31 Mar 08:00 SGT", missing 8 hours.
    // Using the day before ensures the full local day is covered.
    const adjusted = new Date(afterDate);
    adjusted.setDate(adjusted.getDate() - 1);
    const dateStr = adjusted.toISOString().split("T")[0].replace(/-/g, "/");
    query = `after:${dateStr} ${BASE_QUERY}`;
  } else {
    query = `newer_than:30d ${BASE_QUERY}`;
  }

  console.log(`[gmail] Search query: ${query}, max ${maxResults} emails`);

  const allIds: string[] = [];
  let pageToken: string | undefined;

  // Gmail API ignores orderBy with `after:` queries, returning newest first.
  // Collect ALL IDs, then reverse to get oldest-first.
  while (true) {
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: PAGE_SIZE,
      pageToken,
    });

    const messages = listResponse.data.messages ?? [];

    for (const msg of messages) {
      if (msg.id) allIds.push(msg.id);
    }

    pageToken = listResponse.data.nextPageToken ?? undefined;
    if (!pageToken || messages.length === 0) break;

    console.log(`[gmail] Listed ${allIds.length} message IDs so far, fetching next page...`);
  }

  // Reverse: Gmail returns newest-first, we want oldest-first
  allIds.reverse();

  // Filter out already-stored message IDs
  let targetIds = allIds;
  if (userId) {
    const supabase = await createClient();
    const { data: stored } = await supabase
      .from("raw_emails")
      .select("gmail_message_id")
      .in("gmail_message_id", allIds);

    const storedSet = new Set(stored?.map((r) => r.gmail_message_id) ?? []);
    targetIds = allIds.filter((id) => !storedSet.has(id));
    console.log(`[gmail] ${allIds.length} total, ${storedSet.size} already stored, ${targetIds.length} new`);
  }

  targetIds = targetIds.slice(0, maxResults);

  console.log(`[gmail] Found ${allIds.length} messages, fetching ${targetIds.length} oldest full bodies...`);

  // Fetch full message bodies
  const results: GmailMessage[] = [];
  for (let i = 0; i < targetIds.length; i++) {
    const { data: full } = await gmail.users.messages.get({
      userId: "me",
      id: targetIds[i],
      format: "full",
    });

    results.push(parseGmailMessage(full));
    if ((i + 1) % 25 === 0) {
      console.log(`[gmail] Fetched ${i + 1}/${targetIds.length} full messages`);
    }
  }

  return results;
}
