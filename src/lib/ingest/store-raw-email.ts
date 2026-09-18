import { storeRawEmail, findStoredEmailId } from "@/lib/db/raw-emails";
import type { GmailMessage } from "@/types/email";
import type { Db } from "@/utils/supabase/db";

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Stores an email unless it is already there.
 *
 * Inserts first and lets the unique index answer the "is it already stored?"
 * question. `fetchRecentEmails` has already dropped every id it found in
 * `raw_emails`, so a pre-emptive lookup here came back empty nearly every time
 * — 150 wasted round trips a run — and the duplicate handling below was doing
 * the real work anyway.
 */
export async function storeIfNew(
  message: GmailMessage,
  userId: string,
  db?: Db
): Promise<{ id: string; isNew: boolean }> {
  const { data, error } = await storeRawEmail({
    user_id: userId,
    gmail_message_id: message.id,
    gmail_thread_id: message.threadId,
    subject: message.subject,
    from_email: message.from,
    from_name: message.fromName,
    to_email: message.to || null,
    to_name: message.toName || null,
    direction: message.direction,
    received_at: message.receivedAt,
    snippet: message.snippet,
    body_text: message.bodyText,
    body_html: message.bodyHtml || null,
    parse_status: "pending",
    parse_error: null,
  }, db);

  if (error) {
    // Something got there first: Gmail listed the same message on two pages, an
    // earlier run stored it after this one listed its ids, or two syncs overlap.
    // If the row that beat us is ours, the email is stored and that is fine.
    if (error.code === UNIQUE_VIOLATION) {
      const raced = await findStoredEmailId(message.id, userId, db);
      if (raced) {
        return { id: raced, isNew: false };
      }
      // Not ours. gmail_message_id is unique across the whole table rather than
      // per user, so another account holds this message and we cannot store it.
      throw new Error(
        `Email ${message.id} is already stored under a different account`
      );
    }
    throw new Error(`Failed to store email ${message.id}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to store email ${message.id}: no row returned`);
  }

  return { id: data.id, isNew: true };
}
