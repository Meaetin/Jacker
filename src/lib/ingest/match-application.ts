import {
  findApplicationByThread,
  findApplicationByCompanyRole,
} from "@/lib/db/applications";
import type { Application } from "@/types/application";

const tag = "[match]";

export async function findExistingApplication(
  threadId: string | null,
  companyFromSubject: string | null,
  companyFromBody: string | null,
  companyFromEmail: string | null,
  role: string | null,
  userId: string
): Promise<Application | null> {
  console.log(
    `${tag} Matching — threadId: ${threadId ?? "none"} | company_from_subject: "${companyFromSubject ?? "null"}" | company_from_body: "${companyFromBody ?? "null"}" | company_from_email: "${companyFromEmail ?? "null"}" | role: "${role ?? "null"}"`
  );

  // 1. Thread ID — most reliable signal
  if (threadId) {
    const { data: threadMatch } = await findApplicationByThread(threadId, userId);
    if (threadMatch) {
      console.log(
        `${tag} ✓ Matched by thread ID → "${threadMatch.company} - ${threadMatch.role}" (id: ${threadMatch.id})`
      );
      return threadMatch as Application;
    }
    console.log(`${tag} ✗ No thread match`);
  }

  // 2. role + company extracted from subject line
  if (companyFromSubject && role) {
    const { data: subjectMatch } = await findApplicationByCompanyRole(companyFromSubject, role, userId);
    if (subjectMatch) {
      console.log(
        `${tag} ✓ Matched by company_from_subject + role → "${subjectMatch.company} - ${subjectMatch.role}" (id: ${subjectMatch.id})`
      );
      return subjectMatch as Application;
    }
    console.log(`${tag} ✗ No match for company_from_subject "${companyFromSubject}" / role "${role}"`);
  }

  // 3. role + company extracted from email body
  if (companyFromBody && role) {
    const { data: bodyMatch } = await findApplicationByCompanyRole(companyFromBody, role, userId);
    if (bodyMatch) {
      console.log(
        `${tag} ✓ Matched by company_from_body + role → "${bodyMatch.company} - ${bodyMatch.role}" (id: ${bodyMatch.id})`
      );
      return bodyMatch as Application;
    }
    console.log(`${tag} ✗ No match for company_from_body "${companyFromBody}" / role "${role}"`);
  }

  // 4. role + company inferred from sender address
  if (companyFromEmail && role) {
    const { data: emailMatch } = await findApplicationByCompanyRole(companyFromEmail, role, userId);
    if (emailMatch) {
      console.log(
        `${tag} ✓ Matched by company_from_email + role → "${emailMatch.company} - ${emailMatch.role}" (id: ${emailMatch.id})`
      );
      return emailMatch as Application;
    }
    console.log(`${tag} ✗ No match for company_from_email "${companyFromEmail}" / role "${role}"`);
  }

  console.log(`${tag} ✗ No match found — will insert as new application`);
  return null;
}
