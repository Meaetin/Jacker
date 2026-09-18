import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { GmailMessage } from "@/types/email";
import { parseGmailMessage } from "./parse-raw";
import { resolveDb, type Db } from "@/utils/supabase/db";
import { mapWithConcurrency } from "@/utils/concurrency";

const BASE_QUERY = `(application OR applying OR thanks OR "thank you for applying" OR "regret to inform" OR "move forward with other candidates" OR offer OR assessment OR shortlisted OR interview) -category:promotions -category:social`;

const PAGE_SIZE = 50;

// Gmail allows 250 quota units per user per second and messages.get costs 5,
// so 8 in flight sits well inside the budget.
const BODY_FETCH_CONCURRENCY = 8;

// Message ids per stored-email lookup — PostgREST puts them all in the URL.
const ID_LOOKUP_CHUNK = 200;

export async function fetchRecentEmails(
  auth: OAuth2Client,
  maxResults = 200,
  afterDate?: Date,
  userId?: string,
  db?: Db
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

  // Filter out already-stored message IDs. Every id lands in the query string, so
  // this goes out in chunks rather than as one request that grows without bound.
  let targetIds = allIds;
  if (userId) {
    const supabase = await resolveDb(db);
    const storedSet = new Set<string>();

    for (let i = 0; i < allIds.length; i += ID_LOOKUP_CHUNK) {
      const chunk = allIds.slice(i, i + ID_LOOKUP_CHUNK);
      const { data: stored, error } = await supabase
        .from("raw_emails")
        .select("gmail_message_id")
        .eq("user_id", userId)
        .in("gmail_message_id", chunk);

      // Swallowing this would silently re-fetch every body we already have.
      if (error) throw new Error(`Stored-email lookup failed: ${error.message}`);

      for (const row of stored ?? []) {
        if (row.gmail_message_id) storedSet.add(row.gmail_message_id);
      }
    }

    targetIds = allIds.filter((id) => !storedSet.has(id));
    console.log(`[gmail] ${allIds.length} total, ${storedSet.size} already stored, ${targetIds.length} new`);
  }

  targetIds = targetIds.slice(0, maxResults);

  console.log(`[gmail] Found ${allIds.length} messages, fetching ${targetIds.length} oldest full bodies...`);

  // Fetch full message bodies. mapWithConcurrency preserves input order, so the
  // oldest-first ordering established above survives the parallel fetch.
  let fetched = 0;
  return mapWithConcurrency(targetIds, BODY_FETCH_CONCURRENCY, async (id) => {
    const { data: full } = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    fetched++;
    if (fetched % 25 === 0) {
      console.log(`[gmail] Fetched ${fetched}/${targetIds.length} full messages`);
    }
    return parseGmailMessage(full);
  });
}
