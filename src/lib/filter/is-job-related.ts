import type { GmailMessage } from "@/types/email";
import { JOB_KEYWORDS, ATS_DOMAINS } from "./job-keywords";

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : "";
}

export function isLikelyJobRelated(message: GmailMessage): boolean {
  const text = `${message.subject} ${message.snippet}`.toLowerCase();
  const senderDomain = extractDomain(message.from);

  const matchesKeyword = JOB_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  const matchesATS = ATS_DOMAINS.some((domain) =>
    senderDomain.endsWith(domain)
  );

  return matchesKeyword || matchesATS;
}
