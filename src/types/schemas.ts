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

export const editableFieldsSchema = z.object({
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  interview_date: z.string().nullable().optional(),
  interview_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const applicationFiltersSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  company: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

const nonEmptyString = z.string().trim().min(1);
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
  target_roles: z.object({
    primary: z.array(nonEmptyString).default([]),
    archetypes: z
      .array(
        z.object({
          name: optionalString,
          level: optionalString,
          fit: z.enum(["primary", "secondary", "adjacent"]).default("primary"),
        }),
      )
      .default([]),
  }),
  narrative: z.object({
    headline: optionalString,
    exit_story: optionalString,
    superpowers: z.array(nonEmptyString).default([]),
    proof_points: z
      .array(
        z.object({
          name: optionalString,
          url: optionalString,
          hero_metric: optionalString,
        }),
      )
      .default([]),
  }),
  compensation: z.object({
    target_range: optionalString,
    currency: optionalString,
    minimum: optionalString,
    location_flexibility: optionalString,
  }),
  location: z.object({
    country: optionalString,
    city: optionalString,
    timezone: optionalString,
    visa_status: optionalString,
  }),
});

export const candidateProfileUpdateSchema = z.object({
  cv_markdown: z.string().max(120000).optional(),
  profile_data: candidateProfileDataSchema.optional(),
});

export const jobAnalysisRequestSchema = z.object({
  job_description: z.string().trim().min(50).max(60000),
});

export const jobAnalysisResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths_md: z.string().trim().min(1),
  gaps_md: z.string().trim().min(1),
  recommendations_md: z.string().trim().min(1),
  overall_feedback_md: z.string().trim().min(1),
});
