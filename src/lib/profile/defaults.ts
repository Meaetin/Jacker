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
