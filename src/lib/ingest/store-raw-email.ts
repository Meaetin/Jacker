import { storeRawEmail, emailExists } from "@/lib/db/raw-emails";
import type { GmailMessage } from "@/types/email";

export async function storeIfNew(
  message: GmailMessage,
  userId: string
): Promise<{ id: string; isNew: boolean }> {
  const exists = await emailExists(message.id, userId);
  if (exists) {
    return { id: message.id, isNew: false };
  }

  const { data, error } = await storeRawEmail({
    user_id: userId,
    gmail_message_id: message.id,
    gmail_thread_id: message.threadId,
    subject: message.subject,
    from_email: message.from,
    from_name: message.fromName,
    received_at: message.receivedAt,
    snippet: message.snippet,
    body_text: message.bodyText,
    parse_status: "pending",
    parse_error: null,
  });

  if (error || !data) {
    throw new Error(`Failed to store email ${message.id}: ${error?.message}`);
  }

  return { id: data.id, isNew: true };
}
