import { findExistingApplication } from "./match-application";
import { toMatchable, type ApplicationIndex } from "./application-index";
import { shouldApplyStatus } from "./resolve-status-update";
import type { Db } from "@/utils/supabase/db";
import { updateApplication, insertApplication } from "@/lib/db/applications";
import type { AIParseResult } from "@/types/parse-result";
import type { ApplicationStatus } from "@/types/application";
import { normalizeCompany } from "@/utils/normalize-company";

const JOB_BOARDS = new Set([
  "linkedin", "indeed", "glassdoor", "jobstreet", "mycareersfuture",
  "seek", "monster", "ziprecruiter", "handshake", "wellfound",
  "angellist", "internshala", "naukri", "foundit", "careerbuilder",
]);

function isJobBoard(company: string | null): boolean {
  if (!company) return false;
  return JOB_BOARDS.has(company.toLowerCase().trim());
}

function resolveCompany(
  fromSubject: string | null,
  fromEmail: string | null,
  fromBody: string | null
): string | null {
  const raw = fromSubject
    ?? (fromEmail && !isJobBoard(fromEmail) ? fromEmail : null)
    ?? fromBody
    ?? null;
  return normalizeCompany(raw);
}

/**
 * Drops keys whose value is null, so an update only writes fields the incoming
 * email actually carried.
 *
 * Without this, a rejection with no interview details overwrites the interview
 * date the earlier email established — erasing something that really happened.
 */
export function onlyProvided<T extends Record<string, unknown>>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<T>;
}

export type UpsertOutcome = "inserted" | "updated" | "unchanged" | "skipped";

export async function upsertApplication(
  parseResult: AIParseResult,
  rawEmailId: string,
  threadId: string | null,
  userId: string,
  receivedAt: string | null,
  index: ApplicationIndex,
  db?: Db
): Promise<{ data: unknown; outcome: UpsertOutcome }> {
  const companyFromSubject = parseResult.company_from_subject ?? null;
  const companyFromBody = parseResult.company_from_body ?? null;
  const companyFromEmail = parseResult.company_from_email ?? null;
  const role = parseResult.role ?? null;
  const status = (parseResult.status as ApplicationStatus) ?? "unknown";

  const existing = findExistingApplication(
    index,
    threadId,
    companyFromSubject,
    companyFromBody,
    companyFromEmail,
    role
  );

  // No reliable identity — skip to avoid orphaned entries
  if (!existing && !companyFromSubject && !companyFromBody && !companyFromEmail) {
    console.log(
      `[upsert] Skipping — no match found and both company signals are null (role: "${role ?? "null"}")`
    );
    return { data: null, outcome: "skipped" };
  }

  if (existing) {
    const label = `"${existing.company} - ${existing.role}"`;
    const decision = shouldApplyStatus({
      incomingStatus: status,
      incomingReceivedAt: receivedAt,
      existingStatus: existing.status,
      existingUpdatedAt: existing.application_updated_at,
    });

    if (!decision.apply) {
      console.log(
        `[upsert] Keeping ${existing.status} on ${label} — ${decision.reason}`
      );
      return { data: existing, outcome: "unchanged" };
    }

    console.log(
      `[upsert] ${existing.status} → ${status} on ${label} — ${decision.reason}`
    );

    const correctedCompany = resolveCompany(companyFromSubject, companyFromEmail, companyFromBody);
    if (correctedCompany && correctedCompany !== existing.company) {
      console.log(
        `[upsert] Correcting company: "${existing.company}" → "${correctedCompany}"`
      );
    }

    const { data, error } = await updateApplication(existing.id, userId, {
      status,
      status_source: "email",
      status_confidence: parseResult.status_confidence,
      source_email_id: rawEmailId,
      // Detail fields only move forward — a later email that says nothing about
      // the interview must not erase what an earlier one recorded.
      ...onlyProvided({
        interview_date: parseResult.interview_date,
        interview_time: parseResult.interview_time,
        location: parseResult.location,
        notes: parseResult.notes,
      }),
      // Only stamp a date we actually have. Falling back to now() would make an
      // undated email look like it arrived this second, and every later
      // comparison against this row would be measured from the wrong moment.
      ...(receivedAt ? { application_updated_at: receivedAt } : {}),
      ...(correctedCompany && correctedCompany !== existing.company
        ? { company: correctedCompany }
        : {}),
      ...(role && role !== existing.role ? { role } : {}),
    }, db);
    if (error) throw new Error(error.message);

    // Fold the new state back in, so an email later in this run resolves its
    // status against what this write just set rather than the stale snapshot.
    if (data) index.record(toMatchable(data));
    return { data, outcome: "updated" };
  }

  const company = resolveCompany(companyFromSubject, companyFromEmail, companyFromBody);

  const { data, error } = await insertApplication({
    user_id: userId,
    company,
    role,
    status,
    status_source: "email",
    status_confidence: parseResult.status_confidence,
    source_email_id: rawEmailId,
    gmail_thread_id: threadId,
    interview_date: parseResult.interview_date,
    interview_time: parseResult.interview_time,
    location: parseResult.location,
    notes: parseResult.notes,
    application_updated_at: receivedAt,
  }, db);
  if (error) throw new Error(error.message);

  // Without this a second email for the same job would find nothing and insert
  // a duplicate — the database lookup this replaced would have seen the row.
  if (data) index.record(toMatchable(data));
  return { data, outcome: "inserted" };
}
