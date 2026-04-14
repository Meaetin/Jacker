import type { gmail_v1 } from "googleapis";
import type { GmailMessage } from "@/types/email";

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string
): string {
  return headers.find((h) => h.name?.toLowerCase() === name)?.value ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodePart(parts: gmail_v1.Schema$MessagePart[], mimeType: string): string {
  const part = parts.find((p) => p.mimeType === mimeType);
  if (part?.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }
  return "";
}

function decodeBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  const parts = payload.parts ?? [];

  const plainText = decodePart(parts, "text/plain");
  if (plainText) return plainText;

  const html = decodePart(parts, "text/html");
  if (html) return stripHtml(html);

  // Handle nested multipart (e.g. multipart/alternative inside multipart/mixed)
  for (const sub of parts) {
    if (sub.parts?.length) {
      const nested = decodeBody(sub);
      if (nested) return nested;
    }
  }

  return "";
}

export function parseGmailMessage(
  message: gmail_v1.Schema$Message
): GmailMessage {
  const headers = message.payload?.headers ?? [];
  const from = getHeader(headers, "from");
  const fromName = getHeader(headers, "from").split("<")[0].trim();
  const subject = getHeader(headers, "subject");
  const bodyText = decodeBody(message.payload ?? {});

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? null,
    from: from,
    fromName,
    subject,
    snippet: message.snippet ?? "",
    bodyText,
    receivedAt: parseInt(message.internalDate ?? "0", 10)
      ? new Date(parseInt(message.internalDate ?? "0", 10)).toISOString()
      : new Date().toISOString(),
  };
}
