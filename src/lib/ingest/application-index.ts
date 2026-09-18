import { listApplicationsForMatching } from "@/lib/db/applications";
import { normalizeCompany } from "@/utils/normalize-company";
import type { Application, ApplicationStatus } from "@/types/application";
import type { Db } from "@/utils/supabase/db";

/**
 * The slice of an application the matcher and the status resolver need. Kept
 * narrow so a run loads a few columns per row rather than whole records.
 */
export type MatchableApplication = Pick<
  Application,
  | "id"
  | "company"
  | "role"
  | "status"
  | "gmail_thread_id"
  | "application_updated_at"
  | "updated_at"
>;

/** `ilike('%term%')` in memory: a case-insensitive substring test. */
function contains(stored: string | null, term: string): boolean {
  if (!stored) return false;
  return stored.toLowerCase().includes(term.toLowerCase());
}

/**
 * Picks the same row the old SQL did. `order('updated_at', desc).limit(1)`
 * settled ties between two applications sharing a company and role, and since
 * nothing ever writes `updated_at` after insert, that means the newest one.
 */
function newest(matches: MatchableApplication[]): MatchableApplication | null {
  if (matches.length === 0) return null;
  return matches.reduce((best, row) =>
    (row.updated_at ?? "") > (best.updated_at ?? "") ? row : best
  );
}

/**
 * Every application a user has, held for the length of one ingest run so the
 * upsert phase can match against memory instead of the database.
 *
 * The phase used to spend up to four queries per email — thread id, then the
 * three company sources each paired with role — and the three company queries
 * used `ilike('%company%')`, which a leading wildcard keeps off
 * `idx_applications_company_role`. 150 emails cost up to 750 round trips, and
 * got slower as the tracker filled up. This is one query instead.
 *
 * `record` is what makes that safe: an email that creates an application puts it
 * straight into the list, so a later email in the same run still matches it.
 * That only holds while the upsert loop stays sequential.
 */
export class ApplicationIndex {
  private constructor(private readonly rows: MatchableApplication[]) {}

  static async load(userId: string, db?: Db): Promise<ApplicationIndex> {
    const { data, error } = await listApplicationsForMatching(userId, db);

    // Swallowing this would make every email look unmatched, and the run would
    // insert a duplicate application for each one.
    if (error) {
      throw new Error(`Could not load applications for matching: ${error.message}`);
    }

    return new ApplicationIndex((data ?? []) as MatchableApplication[]);
  }

  /** Count of applications currently held, for logging. */
  get size(): number {
    return this.rows.length;
  }

  byThread(threadId: string): MatchableApplication | null {
    return newest(this.rows.filter((row) => row.gmail_thread_id === threadId));
  }

  byCompanyRole(company: string, role: string): MatchableApplication | null {
    const normalized = normalizeCompany(company) ?? company;
    return newest(
      this.rows.filter(
        (row) => contains(row.company, normalized) && contains(row.role, role)
      )
    );
  }

  /**
   * Folds a row this run just wrote back into the list, so the emails after it
   * see it. An update replaces the stored copy — the next email's status
   * decision has to compare against the status this one just set, not the one
   * that was there when the run started.
   */
  record(row: MatchableApplication): void {
    const at = this.rows.findIndex((existing) => existing.id === row.id);
    if (at === -1) {
      this.rows.push(row);
    } else {
      this.rows[at] = row;
    }
  }
}

/** Narrows a written row to what the index holds, defaulting what came back empty. */
export function toMatchable(row: {
  id: string;
  company?: string | null;
  role?: string | null;
  status?: string | null;
  gmail_thread_id?: string | null;
  application_updated_at?: string | null;
  updated_at?: string | null;
}): MatchableApplication {
  return {
    id: row.id,
    company: row.company ?? null,
    role: row.role ?? null,
    status: (row.status as ApplicationStatus) ?? "unknown",
    gmail_thread_id: row.gmail_thread_id ?? null,
    application_updated_at: row.application_updated_at ?? null,
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}
