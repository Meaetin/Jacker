import { describe, it, expect } from "vitest";
import { isLikelyJobRelated } from "./is-job-related";
import type { GmailMessage, EmailDirection } from "@/types/email";

function message(overrides: Partial<GmailMessage> & { direction: EmailDirection }): GmailMessage {
  return {
    id: "m1",
    threadId: "t1",
    from: "someone@example.com",
    fromName: "Someone",
    to: "someone-else@example.com",
    toName: "Someone Else",
    subject: "",
    snippet: "",
    bodyText: "",
    bodyHtml: "",
    receivedAt: "2026-02-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("isLikelyJobRelated", () => {
  describe("received mail", () => {
    it("matches a job keyword in the subject", () => {
      expect(
        isLikelyJobRelated(
          message({ direction: "received", subject: "Your interview with Stripe" })
        )
      ).toBe(true);
    });

    it("matches a known job-board sender even without keywords", () => {
      expect(
        isLikelyJobRelated(
          message({ direction: "received", from: "alerts@linkedin.com", subject: "Hello" })
        )
      ).toBe(true);
    });

    it("rejects unrelated mail", () => {
      expect(
        isLikelyJobRelated(
          message({ direction: "received", subject: "Lunch on Friday?" })
        )
      ).toBe(false);
    });
  });

  describe("sent mail", () => {
    it("matches an application the user wrote", () => {
      expect(
        isLikelyJobRelated(
          message({
            direction: "sent",
            subject: "Application for Backend Engineer",
            to: "careers@stripe.com",
          })
        )
      ).toBe(true);
    });

    it("looks past the snippet into the body", () => {
      // "my resume" sits well beyond the ~200 characters Gmail previews.
      expect(
        isLikelyJobRelated(
          message({
            direction: "sent",
            subject: "Hello",
            snippet: "Dear hiring team,",
            bodyText: `Dear hiring team,\n\n${"filler ".repeat(60)}\nPlease find my resume attached.`,
          })
        )
      ).toBe(true);
    });

    it("matches when the user wrote to a job board", () => {
      expect(
        isLikelyJobRelated(
          message({ direction: "sent", subject: "Hi", to: "jobs@glints.com" })
        )
      ).toBe(true);
    });

    it("does not treat everyday outgoing mail as an application", () => {
      // "thanks" and "interview" are in JOB_KEYWORDS and would match on the
      // received path. Sent mail uses a narrower list precisely to avoid this.
      expect(
        isLikelyJobRelated(
          message({
            direction: "sent",
            subject: "Thanks for the interview prep!",
            to: "colleague@work.com",
            bodyText: "Really appreciate you running through those questions with me.",
          })
        )
      ).toBe(false);
    });

    it("ignores the sender domain, which is always the user", () => {
      // On the received path a linkedin.com sender is signal. On sent mail the
      // From is the user's own address, so it must not count for anything.
      expect(
        isLikelyJobRelated(
          message({
            direction: "sent",
            from: "martin@linkedin.com",
            to: "friend@example.com",
            subject: "Dinner tomorrow",
          })
        )
      ).toBe(false);
    });
  });
});
