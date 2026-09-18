import { describe, it, expect } from "vitest";
import { shouldApplyStatus } from "./resolve-status-update";

const JAN = "2026-01-10T00:00:00.000Z";
const FEB = "2026-02-10T00:00:00.000Z";
const MAR = "2026-03-10T00:00:00.000Z";

describe("shouldApplyStatus", () => {
  it("moves an application forward when the email is newer", () => {
    const decision = shouldApplyStatus({
      incomingStatus: "interview",
      incomingReceivedAt: FEB,
      existingStatus: "applied",
      existingUpdatedAt: JAN,
    });
    expect(decision.apply).toBe(true);
  });

  it("lets a later interview reopen a rejected application", () => {
    // The old severity ladder put `rejected` on top, which froze the row: a
    // follow-up invitation for another team ranked lower and was dropped.
    const decision = shouldApplyStatus({
      incomingStatus: "interview",
      incomingReceivedAt: MAR,
      existingStatus: "rejected",
      existingUpdatedAt: FEB,
    });
    expect(decision.apply).toBe(true);
  });

  it("lets a later rejection supersede an offer", () => {
    const decision = shouldApplyStatus({
      incomingStatus: "rejected",
      incomingReceivedAt: MAR,
      existingStatus: "offer",
      existingUpdatedAt: FEB,
    });
    expect(decision.apply).toBe(true);
  });

  it("refuses an older rejection that would clobber a newer offer", () => {
    const decision = shouldApplyStatus({
      incomingStatus: "rejected",
      incomingReceivedAt: JAN,
      existingStatus: "offer",
      existingUpdatedAt: MAR,
    });
    expect(decision.apply).toBe(false);
  });

  it("refuses an older email even when it outranks on the ladder", () => {
    const decision = shouldApplyStatus({
      incomingStatus: "interview",
      incomingReceivedAt: JAN,
      existingStatus: "rejected",
      existingUpdatedAt: FEB,
    });
    expect(decision.apply).toBe(false);
  });

  it("never lets an unknown status overwrite a real one", () => {
    const decision = shouldApplyStatus({
      incomingStatus: "unknown",
      incomingReceivedAt: MAR,
      existingStatus: "applied",
      existingUpdatedAt: JAN,
    });
    expect(decision.apply).toBe(false);
  });

  describe("without usable dates, the ladder decides", () => {
    it("applies a higher-ranked status when both dates are missing", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "interview",
        incomingReceivedAt: null,
        existingStatus: "applied",
        existingUpdatedAt: null,
      });
      expect(decision.apply).toBe(true);
    });

    it("refuses a lower-ranked status when both dates are missing", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "applied",
        incomingReceivedAt: null,
        existingStatus: "interview",
        existingUpdatedAt: null,
      });
      expect(decision.apply).toBe(false);
    });

    it("falls back when only the incoming email is undated", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "offer",
        incomingReceivedAt: null,
        existingStatus: "applied",
        existingUpdatedAt: JAN,
      });
      expect(decision.apply).toBe(true);
    });

    it("prefers offer over rejected on an exact tie", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "offer",
        incomingReceivedAt: FEB,
        existingStatus: "rejected",
        existingUpdatedAt: FEB,
      });
      expect(decision.apply).toBe(true);
    });

    it("treats an unparseable date as no date rather than NaN", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "interview",
        incomingReceivedAt: "not-a-date",
        existingStatus: "applied",
        existingUpdatedAt: JAN,
      });
      expect(decision.apply).toBe(true);
    });
  });

  describe("timezone formats", () => {
    // Postgres returns `+00:00`, Gmail gives `Z`. Comparing these as strings
    // gets the order wrong even when they describe the same moment.
    it("compares instants, not text, across offset formats", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "offer",
        incomingReceivedAt: "2026-02-10T11:00:00.000Z",
        existingStatus: "applied",
        existingUpdatedAt: "2026-02-10T10:00:00+00:00",
      });
      expect(decision.apply).toBe(true);
    });

    it("recognises the same instant written two ways", () => {
      const decision = shouldApplyStatus({
        incomingStatus: "applied",
        incomingReceivedAt: "2026-02-10T18:00:00+08:00",
        existingStatus: "interview",
        existingUpdatedAt: "2026-02-10T10:00:00Z",
      });
      // Same moment, so the ladder decides — and applied does not outrank interview.
      expect(decision.apply).toBe(false);
    });
  });
});
