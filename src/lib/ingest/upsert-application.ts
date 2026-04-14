import { findExistingApplication } from "./match-application";
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

const STATUS_PRIORITY: Record<ApplicationStatus, number> = {
  unknown: 0,
  applied: 1,
  assessment: 2,
  interview: 3,
  offer: 4,
  rejected: 5,
};

export type UpsertOutcome = "inserted" | "updated" | "unchanged" | "skipped";

export async function upsertApplication(
  parseResult: AIParseResult,
  rawEmailId: string,
  threadId: string | null,
  userId: string,
  receivedAt: string | null
): Promise<{ data: unknown; outcome: UpsertOutcome }> {
  const companyFromSubject = parseResult.company_from_subject ?? null;
  const companyFromBody = parseResult.company_from_body ?? null;
  const companyFromEmail = parseResult.company_from_email ?? null;
  const role = parseResult.role ?? null;
  const status = (parseResult.status as ApplicationStatus) ?? "unknown";

  const existing = await findExistingApplication(
    threadId,
    companyFromSubject,
    companyFromBody,
    companyFromEmail,
    role,
    userId
  );

  // No reliable identity — skip to avoid orphaned entries
  if (!existing && !companyFromSubject && !companyFromBody && !companyFromEmail) {
    console.log(
      `[upsert] Skipping — no match found and both company signals are null (role: "${role ?? "null"}")`
    );
    return { data: null, outcome: "skipped" };
  }

  if (existing) {
    const currentPriority =
      STATUS_PRIORITY[existing.status as ApplicationStatus] ?? 0;
    const newPriority = STATUS_PRIORITY[status] ?? 0;

    if (newPriority > currentPriority) {
      const correctedCompany = resolveCompany(companyFromSubject, companyFromEmail, companyFromBody);
      if (correctedCompany && correctedCompany !== existing.company) {
        console.log(
          `[upsert] Correcting company: "${existing.company}" → "${correctedCompany}"`
        );
      }

      const { data, error } = await updateApplication(existing.id, userId, {
        status,
        status_confidence: parseResult.status_confidence,
        source_email_id: rawEmailId,
        interview_date: parseResult.interview_date,
        interview_time: parseResult.interview_time,
        location: parseResult.location,
        notes: parseResult.notes,
        application_updated_at: receivedAt ?? new Date().toISOString(),
        ...(correctedCompany && correctedCompany !== existing.company
          ? { company: correctedCompany }
          : {}),
        ...(role && role !== existing.role ? { role } : {}),
      });
      if (error) throw new Error(error.message);
      return { data, outcome: "updated" };
    }

    return { data: existing, outcome: "unchanged" };
  }

  const company = resolveCompany(companyFromSubject, companyFromEmail, companyFromBody);

  const { data, error } = await insertApplication({
    user_id: userId,
    company,
    role,
    status,
    status_confidence: parseResult.status_confidence,
    source_email_id: rawEmailId,
    gmail_thread_id: threadId,
    interview_date: parseResult.interview_date,
    interview_time: parseResult.interview_time,
    location: parseResult.location,
    notes: parseResult.notes,
    application_updated_at: receivedAt,
  });
  if (error) throw new Error(error.message);
  return { data, outcome: "inserted" };
}
