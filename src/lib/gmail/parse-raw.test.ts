import { describe, it, expect } from "vitest";
import type { gmail_v1 } from "googleapis";
import { parseGmailMessage } from "./parse-raw";

function gmailMessage(
  headers: Record<string, string>,
  labelIds: string[] = []
): gmail_v1.Schema$Message {
  return {
    id: "m1",
    threadId: "t1",
    labelIds,
    internalDate: String(Date.UTC(2026, 1, 10)),
    snippet: "preview",
    payload: {
      headers: Object.entries(headers).map(([name, value]) => ({ name, value })),
      body: { data: Buffer.from("body text").toString("base64url") },
    },
  };
}

describe("parseGmailMessage", () => {
  it("treats a message without the SENT label as received", () => {
    const parsed = parseGmailMessage(
      gmailMessage({ From: "Talent <talent@stripe.com>", To: "me@gmail.com" }, ["INBOX"])
    );
    expect(parsed.direction).toBe("received");
  });

  it("treats a message with the SENT label as sent", () => {
    const parsed = parseGmailMessage(
      gmailMessage({ From: "Me <me@gmail.com>", To: "careers@stripe.com" }, ["SENT"])
    );
    expect(parsed.direction).toBe("sent");
  });

  it("captures the recipient, which is the only company signal on sent mail", () => {
    const parsed = parseGmailMessage(
      gmailMessage({ From: "Me <me@gmail.com>", To: "Careers <careers@stripe.com>" }, ["SENT"])
    );
    expect(parsed.to).toBe("Careers <careers@stripe.com>");
    expect(parsed.toName).toBe("Careers");
  });

  it("defaults direction to received when labelIds is absent", () => {
    const parsed = parseGmailMessage(
      gmailMessage({ From: "Talent <talent@stripe.com>", To: "me@gmail.com" })
    );
    expect(parsed.direction).toBe("received");
  });

  it("leaves the recipient empty when there is no To header", () => {
    const parsed = parseGmailMessage(gmailMessage({ From: "Talent <talent@stripe.com>" }));
    expect(parsed.to).toBe("");
    expect(parsed.toName).toBe("");
  });
});
