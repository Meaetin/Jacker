import { z } from "zod";
import { APPLICATION_STATUSES } from "./application";

const nullableString = z
  .string()
  .nullable()
  .or(z.undefined().transform(() => null));

const nullableCoerceNumber = z.preprocess(
  (val) => (val === undefined || val === null || Number.isNaN(val) ? null : Number(val)),
  z.number().min(0).max(1).nullable(),
);

export const aiParseResultSchema = z.object({
  is_job_related: z.boolean().catch(false),
  company_from_subject: nullableString,
  company_from_body: nullableString,
  company_from_email: nullableString,
  role: nullableString,
  status: z.enum(APPLICATION_STATUSES).catch("unknown").nullable().or(z.undefined().transform(() => null)),
  status_confidence: nullableCoerceNumber,
  email_type: z
    .enum([
      "application_update",
      "application_sent",
      "interview_invitation",
      "rejection",
      "offer",
      "assessment",
      "job_alert",
      "application_viewed",
      "recruiter_outreach",
      "other",
    ])
    .catch("other")
    .nullable()
    .or(z.undefined().transform(() => null)),
  interview_date: nullableString,
  interview_time: nullableString,
  location: nullableString,
  notes: nullableString,
});

// Trim incoming text; treat empty/whitespace-only as "cleared" (null) so
// nullable columns don't store "" and date columns don't get an invalid "".
const trimToNull = (val: unknown) => {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
};

// Nullable text column: "" -> null, otherwise a trimmed string.
const editableNullableText = z.preprocess(
  trimToNull,
  z.string().nullable().optional(),
);

// Required text (company/role): trim, must be non-empty when provided.
const editableRequiredText = z.preprocess(
  (val) => (typeof val === "string" ? val.trim() : val),
  z.string().min(1).optional(),
);

// Postgres `date` column: accept only YYYY-MM-DD or null. Empty -> null.
// Rejecting malformed dates here turns a would-be DB 500 into a clean 400.
const editableDate = z.preprocess(
  trimToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid calendar date")
    .nullable()
    .optional(),
);

export const editableFieldsSchema = z.object({
  company: editableRequiredText,
  role: editableRequiredText,
  status: z.enum(APPLICATION_STATUSES).optional(),
  interview_date: editableDate,
  interview_time: editableNullableText,
  location: editableNullableText,
  notes: editableNullableText,
});

export const applicationFiltersSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  company: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  // Table view paginates at 20; kanban requests the whole board in one page.
  limit: z.coerce.number().min(1).max(1000).default(20),
});

const optionalString = z.string().trim().optional().default("");

export const candidateProfileDataSchema = z.object({
  candidate: z.object({
    full_name: optionalString,
    email: optionalString,
    phone: optionalString,
    location: optionalString,
    linkedin: optionalString,
    portfolio_url: optionalString,
    github: optionalString,
    twitter: optionalString,
  }),
  personal_details: z.object({
    address: optionalString,
    city: optionalString,
    postal_code: optionalString,
    country: optionalString,
    citizenship: optionalString,
    work_authorization: optionalString,
    current_occupation: optionalString,
    notice_period: optionalString,
    willing_to_relocate: optionalString,
    date_of_birth: optionalString,
    gender: optionalString,
  }),
  education: z
    .array(
      z.object({
        institution: optionalString,
        degree: optionalString,
        field_of_study: optionalString,
        start_date: optionalString,
        end_date: optionalString,
        grade: optionalString,
      }),
    )
    .default([]),
  work_experience: z
    .array(
      z.object({
        job_title: optionalString,
        company: optionalString,
        location: optionalString,
        start_date: optionalString,
        end_date: optionalString,
        is_current: z.boolean().default(false),
        description: optionalString,
      }),
    )
    .default([]),
  ai_summary: optionalString,
});

export const candidateProfileUpdateSchema = z.object({
  profile_data: candidateProfileDataSchema.optional(),
});

export const kanbanColumnOrderSchema = z.object({
  kanbanColumnOrder: z.array(z.enum(APPLICATION_STATUSES)).min(1),
});

export const jobAnalysisRequestSchema = z.object({
  job_description: z.string().trim().min(50).max(60000).optional(),
  source_url: z.string().trim().url().optional(),
  company_name: z.string().trim().max(200).optional(),
  job_title: z.string().trim().max(200).optional(),
}).superRefine((value, ctx) => {
  if (!value.job_description && !value.source_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either job_description or source_url is required.",
    });
  }
});

export const documentGenerationRequestSchema = z.object({
  analysis_id: z.string().uuid(),
  document_type: z.enum(["cover_letter", "application_email"]),
  custom_instructions: z.string().trim().max(2000).optional(),
});

export const extractedDescriptionSchema = z.object({
  company_overview: z.string().nullable(),
  role_summary: z.string().nullable(),
  responsibilities: z.string().nullable(),
  requirements: z.string().nullable(),
  nice_to_have: z.string().nullable(),
  benefits: z.string().nullable(),
  location_info: z.string().nullable(),
  extracted_company_name: z.string().trim().max(200).nullable(),
  extracted_job_title: z.string().trim().max(200).nullable(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(10000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  analysis_id: z.string().uuid().optional(),
});

export const jobAnalysisResultSchema = z.object({
  company_name: z.string().trim().max(200).nullable().or(z.undefined().transform(() => null)),
  job_title: z.string().trim().max(200).nullable().or(z.undefined().transform(() => null)),
  score: z.number().int().min(0).max(100),
  matches_md: z.string().trim().min(1),
  gaps_md: z.string().trim().min(1),
  recommendations_md: z.string().trim().min(1),
  overall_feedback_md: z.string().trim().min(1),
});
