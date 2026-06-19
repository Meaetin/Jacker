import type { CandidateProfileData, FitBand } from "@/types/profile";

export const DEFAULT_PROFILE_DATA: CandidateProfileData = {
  candidate: {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio_url: "",
    github: "",
    twitter: "",
  },
  personal_details: {
    address: "",
    city: "",
    postal_code: "",
    country: "",
    citizenship: "",
    work_authorization: "",
    current_occupation: "",
    notice_period: "",
    willing_to_relocate: "",
    date_of_birth: "",
    gender: "",
  },
  education: [],
  work_experience: [],
  ai_summary: "",
};

export function getScoreBand(score: number): FitBand {
  if (score >= 75) return "strong_fit";
  if (score >= 50) return "moderate_fit";
  return "weak_fit";
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeObjectArray(
  value: unknown,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
}

export function normalizeProfileData(input: unknown): CandidateProfileData {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const candidate = (source.candidate as Record<string, unknown>) ?? {};
  const personalDetails = (source.personal_details as Record<string, unknown>) ?? {};

  return {
    candidate: {
      full_name: normalizeString(candidate.full_name),
      email: normalizeString(candidate.email),
      phone: normalizeString(candidate.phone),
      location: normalizeString(candidate.location),
      linkedin: normalizeString(candidate.linkedin),
      portfolio_url: normalizeString(candidate.portfolio_url),
      github: normalizeString(candidate.github),
      twitter: normalizeString(candidate.twitter),
    },
    personal_details: {
      address: normalizeString(personalDetails.address),
      city: normalizeString(personalDetails.city),
      postal_code: normalizeString(personalDetails.postal_code),
      country: normalizeString(personalDetails.country),
      citizenship: normalizeString(personalDetails.citizenship),
      work_authorization: normalizeString(personalDetails.work_authorization),
      current_occupation: normalizeString(personalDetails.current_occupation),
      notice_period: normalizeString(personalDetails.notice_period),
      willing_to_relocate: normalizeString(personalDetails.willing_to_relocate),
      date_of_birth: normalizeString(personalDetails.date_of_birth),
      gender: normalizeString(personalDetails.gender),
    },
    education: normalizeObjectArray(source.education).map((item) => ({
      institution: normalizeString(item.institution),
      degree: normalizeString(item.degree),
      field_of_study: normalizeString(item.field_of_study),
      start_date: normalizeString(item.start_date),
      end_date: normalizeString(item.end_date),
      grade: normalizeString(item.grade),
    })),
    work_experience: normalizeObjectArray(source.work_experience).map((item) => ({
      job_title: normalizeString(item.job_title),
      company: normalizeString(item.company),
      location: normalizeString(item.location),
      start_date: normalizeString(item.start_date),
      end_date: normalizeString(item.end_date),
      is_current: normalizeBoolean(item.is_current),
      description: normalizeString(item.description),
    })),
    ai_summary: normalizeString(source.ai_summary),
  };
}
