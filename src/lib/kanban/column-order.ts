import type { ApplicationStatus } from "@/types/application";

/**
 * Canonical default order of kanban columns and the source of truth for
 * reconciling any stored/custom order. This is intentionally distinct from
 * APPLICATION_STATUSES (which has a different ordering) — the kanban board
 * displays columns in this order by default.
 */
export const DEFAULT_COLUMN_ORDER: ApplicationStatus[] = [
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "unknown",
];

const VALID_STATUSES = new Set<string>(DEFAULT_COLUMN_ORDER);

/**
 * Reconcile a stored column order against the current set of statuses:
 * - drops values that are no longer valid statuses
 * - dedupes
 * - appends any current statuses missing from the stored order (to the end)
 *
 * Always returns a complete, valid permutation of the current statuses, so the
 * board never loses or duplicates a column regardless of what was persisted.
 */
export function reconcileColumnOrder(stored: readonly string[]): ApplicationStatus[] {
  const seen = new Set<ApplicationStatus>();
  const reconciled: ApplicationStatus[] = [];

  for (const value of stored) {
    if (VALID_STATUSES.has(value) && !seen.has(value as ApplicationStatus)) {
      seen.add(value as ApplicationStatus);
      reconciled.push(value as ApplicationStatus);
    }
  }

  for (const status of DEFAULT_COLUMN_ORDER) {
    if (!seen.has(status)) reconciled.push(status);
  }

  return reconciled;
}
