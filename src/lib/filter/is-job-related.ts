import type { GmailMessage } from "@/types/email";
import { JOB_KEYWORDS, SENT_JOB_KEYWORDS, ATS_DOMAINS } from "./job-keywords";

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : "";
}

export function isLikelyJobRelated(message: GmailMessage): boolean {
  const text = `${message.subject} ${message.snippet}`.toLowerCase();

  // Mail the user sent needs different handling on both halves. The sender is
  // the user, so matching ATS domains against it is meaningless — the company
  // is in the To header instead. And the inbound keyword list is far too broad
  // for outgoing mail, so a narrower "I am applying" list does the work.
  if (message.direction === "sent") {
    // Search the opening of the body too, not just the snippet. The phrase that
    // identifies an application ("please find my resume attached") often sits
    // past the ~200 characters Gmail previews.
    const sentText = `${text} ${message.bodyText.slice(0, 2000).toLowerCase()}`;
    const matchesIntent = SENT_JOB_KEYWORDS.some((kw) => sentText.includes(kw));
    const recipientIsATS = ATS_DOMAINS.some((domain) =>
      extractDomain(message.to).endsWith(domain)
    );
    return matchesIntent || recipientIsATS;
  }

  const senderDomain = extractDomain(message.from);

  const matchesKeyword = JOB_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  const matchesATS = ATS_DOMAINS.some((domain) =>
    senderDomain.endsWith(domain)
  );

  return matchesKeyword || matchesATS;
}
