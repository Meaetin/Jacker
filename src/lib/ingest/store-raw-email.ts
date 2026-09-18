import { storeRawEmail, findStoredEmailId } from "@/lib/db/raw-emails";
import type { GmailMessage } from "@/types/email";
import type { Db } from "@/utils/supabase/db";

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

export async function storeIfNew(
  message: GmailMessage,
  userId: string,
  db?: Db
): Promise<{ id: string; isNew: boolean }> {
  const existingId = await findStoredEmailId(message.id, userId, db);
  if (existingId) {
    return { id: existingId, isNew: false };
  }

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
    // Checking then inserting is not atomic, so a second writer can land in
    // between: Gmail lists the same message on two pages, or two syncs overlap.
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
