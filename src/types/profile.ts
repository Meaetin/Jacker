export type FitBand = "strong_fit" | "moderate_fit" | "weak_fit";

export interface RoleArchetype {
  name: string;
  level: string;
  fit: "primary" | "secondary" | "adjacent";
}

export interface ProofPoint {
  name: string;
  url: string;
  hero_metric: string;
}

export interface CandidateProfileData {
  candidate: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio_url: string;
    github: string;
    twitter: string;
  };
  target_roles: {
    primary: string[];
    archetypes: RoleArchetype[];
  };
  narrative: {
    headline: string;
    exit_story: string;
    superpowers: string[];
    proof_points: ProofPoint[];
  };
  compensation: {
    target_range: string;
    currency: string;
    minimum: string;
    location_flexibility: string;
  };
  location: {
    country: string;
    city: string;
    timezone: string;
    visa_status: string;
  };
}

export interface CandidateProfileRecord {
  id: string;
  user_id: string;
  profile_data: CandidateProfileData;
  cv_markdown: string | null;
  cv_filename: string | null;
  cv_mime_type: string | null;
  cv_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentType = "cover_letter" | "application_email";

export interface GeneratedContent {
  content_md: string;
  document_type: DocumentType;
}

export interface JobFitAnalysis {
  id: string;
  user_id: string;
  job_description: string;
  company_name: string | null;
  job_title: string | null;
  source_url: string | null;
  score: number;
  band: FitBand;
  strengths_md: string;
  gaps_md: string;
  recommendations_md: string;
  overall_feedback_md: string;
  created_at: string;
}
