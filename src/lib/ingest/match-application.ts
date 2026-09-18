import type { ApplicationIndex, MatchableApplication } from "./application-index";

const tag = "[match]";

/**
 * Finds the application an email belongs to, in the order the signals can be
 * trusted: the Gmail thread first, then role paired with each of the three
 * places the parser can find a company.
 *
 * Reads the run's in-memory index rather than the database. The tiers, their
 * order and their matching rules are unchanged — a company matches when the
 * stored name contains the parsed one, case-insensitively, exactly as the
 * `ilike('%company%')` queries this replaced did.
 */
export function findExistingApplication(
  index: ApplicationIndex,
  threadId: string | null,
  companyFromSubject: string | null,
  companyFromBody: string | null,
  companyFromEmail: string | null,
  role: string | null
): MatchableApplication | null {
  console.log(
    `${tag} Matching — threadId: ${threadId ?? "none"} | company_from_subject: "${companyFromSubject ?? "null"}" | company_from_body: "${companyFromBody ?? "null"}" | company_from_email: "${companyFromEmail ?? "null"}" | role: "${role ?? "null"}"`
  );

  // 1. Thread ID — most reliable signal
  if (threadId) {
    const threadMatch = index.byThread(threadId);
    if (threadMatch) {
      console.log(
        `${tag} ✓ Matched by thread ID → "${threadMatch.company} - ${threadMatch.role}" (id: ${threadMatch.id})`
      );
      return threadMatch;
    }
    console.log(`${tag} ✗ No thread match`);
  }

  const tiers: [label: string, company: string | null][] = [
    ["company_from_subject", companyFromSubject],
    ["company_from_body", companyFromBody],
    ["company_from_email", companyFromEmail],
  ];

  // 2-4. role + company, taking the company from the subject, then the body,
  // then the sender address.
  for (const [label, company] of tiers) {
    if (!company || !role) continue;

    const match = index.byCompanyRole(company, role);
    if (match) {
      console.log(
        `${tag} ✓ Matched by ${label} + role → "${match.company} - ${match.role}" (id: ${match.id})`
      );
      return match;
    }
    console.log(`${tag} ✗ No match for ${label} "${company}" / role "${role}"`);
  }

  console.log(`${tag} ✗ No match found — will insert as new application`);
  return null;
}
