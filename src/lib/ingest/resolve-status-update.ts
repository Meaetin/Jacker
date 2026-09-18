import type { ApplicationStatus } from "@/types/application";

/**
 * Tiebreaker only, for when two emails share a timestamp or one of them has no
 * usable date. `offer` sits above `rejected` because a rejection is the status
 * the parser most often misattributes, and it should not win a coin flip.
 */
const STATUS_PRIORITY: Record<ApplicationStatus, number> = {
  unknown: 0,
  applied: 1,
  assessment: 2,
  interview: 3,
  rejected: 4,
  offer: 5,
};

export interface StatusDecisionInput {
  incomingStatus: ApplicationStatus;
  /** When the incoming email was received. */
  incomingReceivedAt: string | null;
  existingStatus: ApplicationStatus;
  /** Date of the email that last set the stored status. */
  existingUpdatedAt: string | null;
}

export interface StatusDecision {
  apply: boolean;
  /** Plain-language explanation, logged at the call site. */
  reason: string;
}

/**
 * Decides whether an incoming email's status should replace the stored one.
 *
 * The email's date decides: the most recent email wins. This used to compare a
 * severity ladder instead, which made a rejection permanent — it outranked
 * everything, so a later interview invitation for another team was dropped.
 */
export function shouldApplyStatus({
  incomingStatus,
  incomingReceivedAt,
  existingStatus,
  existingUpdatedAt,
}: StatusDecisionInput): StatusDecision {
  // A parse that could not work out a status must never erase a real one.
  if (incomingStatus === "unknown") {
    return { apply: false, reason: "incoming status is unknown" };
  }

  const incomingTime = toTime(incomingReceivedAt);
  const existingTime = toTime(existingUpdatedAt);

  if (incomingTime !== null && existingTime !== null) {
    if (incomingTime > existingTime) {
      return { apply: true, reason: "incoming email is newer" };
    }
    if (incomingTime < existingTime) {
      return { apply: false, reason: "incoming email is older than the stored status" };
    }
    // Same instant — fall through to the ladder below.
  }

  // One side has no usable date, or both landed on the same instant. Fall back
  // to the severity ladder, which is what every email used to go through.
  const incomingRank = STATUS_PRIORITY[incomingStatus] ?? 0;
  const existingRank = STATUS_PRIORITY[existingStatus] ?? 0;

  return incomingRank > existingRank
    ? { apply: true, reason: `no date order available, ${incomingStatus} outranks ${existingStatus}` }
    : { apply: false, reason: `no date order available, ${incomingStatus} does not outrank ${existingStatus}` };
}

/**
 * Parses rather than string-compares: `application_updated_at` comes back from
 * Postgres as `+00:00` while Gmail dates arrive as `Z`, and those two sort
 * differently as text even when they describe the same moment.
 */
function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}
