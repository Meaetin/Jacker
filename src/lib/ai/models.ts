/**
 * Central registry of which OpenAI model each AI task uses.
 *
 * This is the single source of truth — every call site reads from this map, so
 * re-tiering a task is a one-line change here. Do not hardcode model strings at
 * call sites.
 *
 * Tiering rationale:
 * - Cheap tier — schema-bound extraction / classification, often high volume.
 *   Quality is "did it fill the fields correctly", which small models do well.
 * - Quality tier — judgment (scoring) and user-facing writing, low volume.
 *   These are what users actually evaluate, and the cost delta is tiny because
 *   they run occasionally, not per-email.
 *
 * OpenAI model reference (2026):
 *   gpt-4.1-nano   $0.10 / $0.40    cheapest; schema-bound extraction
 *   gpt-4.1-mini   $0.40 / $1.60    ~gpt-4o quality; default workhorse
 *   gpt-4.1        $2 / $8          strong reasoning + writing
 *   o4-mini        $1.10 / $4.40    reasoning model; alternative for scoring
 *   gpt-5.4 / 5.5  frontier         bump here when max quality is worth it
 */
export const AI_MODELS = {
  /** Classify + extract fields from each inbound email. Highest volume — keep cheap. */
  emailParse: "gpt-4.1-nano",

  /** Parse a scraped job posting into structured description sections. */
  jobExtraction: "gpt-4.1-mini",

  /** Convert CV text → structured profile JSON (incl. ai_summary). Larger schema + synthesis. */
  cvToProfile: "gpt-4.1-mini",

  /** Regenerate the AI summary from the current profile + CV. */
  profileSummary: "gpt-4.1-mini",

  /** Career-assistant chat. Grounded, conversational, streamed. */
  chat: "gpt-4.1-mini",

  /** Score candidate↔job fit (matches / gaps / recommendations). Judgment-heavy — quality tier. */
  jobFitAnalysis: "gpt-4.1",

  /** Generate cover letters / application emails. User-facing deliverable — quality tier. */
  documentGeneration: "gpt-4.1",
} as const;

export type AiTask = keyof typeof AI_MODELS;
