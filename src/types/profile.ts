export type FitBand = "strong_fit" | "moderate_fit" | "weak_fit";

export interface EducationEntry {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  grade: string;
}

export interface WorkExperienceEntry {
  job_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

export interface CandidateProfileData {
  candidate: {
    full_name: string;
    preferred_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio_url: string;
    github: string;
    twitter: string;
  };
  personal_details: {
    address: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone_country_code: string;
    phone_device_type: string;
    citizenship: string;
    work_authorization: string;
    current_occupation: string;
    notice_period: string;
    willing_to_relocate: string;
    date_of_birth: string;
    gender: string;
  };
  education: EducationEntry[];
  work_experience: WorkExperienceEntry[];
  skills: string[];
  ai_summary: string;
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
  matches_md: string;
  gaps_md: string;
  recommendations_md: string;
  overall_feedback_md: string;
  created_at: string;
}
