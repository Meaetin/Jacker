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
  target_roles: {
    primary: [],
    archetypes: [],
  },
  narrative: {
    headline: "",
    exit_story: "",
    superpowers: [],
    proof_points: [],
  },
  compensation: {
    target_range: "",
    currency: "USD",
    minimum: "",
    location_flexibility: "",
  },
  location: {
    country: "",
    city: "",
    timezone: "",
    visa_status: "",
  },
};

export function getScoreBand(score: number): FitBand {
  if (score >= 75) return "strong_fit";
  if (score >= 50) return "moderate_fit";
  return "weak_fit";
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

export function normalizeProfileData(input: unknown): CandidateProfileData {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const candidate = (source.candidate as Record<string, unknown>) ?? {};
  const targetRoles = (source.target_roles as Record<string, unknown>) ?? {};
  const narrative = (source.narrative as Record<string, unknown>) ?? {};
  const compensation = (source.compensation as Record<string, unknown>) ?? {};
  const location = (source.location as Record<string, unknown>) ?? {};

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
    target_roles: {
      primary: normalizeStringArray(targetRoles.primary),
      archetypes: Array.isArray(targetRoles.archetypes)
        ? targetRoles.archetypes
            .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
            .map((item) => ({
              name: normalizeString(item.name),
              level: normalizeString(item.level),
              fit: item.fit === "secondary" || item.fit === "adjacent" ? item.fit : "primary",
            }))
        : [],
    },
    narrative: {
      headline: normalizeString(narrative.headline),
      exit_story: normalizeString(narrative.exit_story),
      superpowers: normalizeStringArray(narrative.superpowers),
      proof_points: Array.isArray(narrative.proof_points)
        ? narrative.proof_points
            .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
            .map((item) => ({
              name: normalizeString(item.name),
              url: normalizeString(item.url),
              hero_metric: normalizeString(item.hero_metric),
            }))
        : [],
    },
    compensation: {
      target_range: normalizeString(compensation.target_range),
      currency: normalizeString(compensation.currency) || "USD",
      minimum: normalizeString(compensation.minimum),
      location_flexibility: normalizeString(compensation.location_flexibility),
    },
    location: {
      country: normalizeString(location.country),
      city: normalizeString(location.city),
      timezone: normalizeString(location.timezone),
      visa_status: normalizeString(location.visa_status),
    },
  };
}
