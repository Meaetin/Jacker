import type {
  CandidateProfileData,
  EducationEntry,
  WorkExperienceEntry,
} from "@/types/profile";

/** An education entry plus the dropdown-friendly spellings of its degree. */
export interface AutofillEducationEntry extends EducationEntry {
  degree_aliases: string[];
}

// Forms offer degree as a fixed list of levels, so the stored wording
// ("Bachelor of Science (Honours)") has to be matched against options like
// "Bachelor's Degree". Most specific level first: a doctorate mentioning a
// master's should still read as a doctorate.
// Every abbreviation is anchored on both sides. Without the leading \b, the
// "ma" inside "Diploma" reads as an MA and a polytechnic diploma comes out as
// a master's degree.
const DEGREE_LEVELS: { test: RegExp; aliases: string[] }[] = [
  { test: /\bph\.?d\b|\bdoctor|\bdphil\b/i, aliases: ["Doctorate", "PhD", "Doctoral Degree"] },
  {
    test: /\bmaster|\bm\.?sc\b|\bm\.?eng\b|\bmba\b|\bm\.?a\.?\b/i,
    aliases: ["Master's Degree", "Masters", "Master"],
  },
  {
    test: /\bbachelor|\bb\.?sc\b|\bb\.?eng\b|\bb\.?a\.?\b|honours\b|\bhons\b|undergraduate/i,
    aliases: ["Bachelor's Degree", "Bachelors", "Bachelor", "Undergraduate Degree"],
  },
  { test: /\bdiploma\b|\bpoly(technic)?\b/i, aliases: ["Diploma", "Advanced Diploma"] },
  { test: /\bcertificate\b|\bcert\b/i, aliases: ["Certificate"] },
  {
    test: /a.?level|o.?level|high.?school|secondary/i,
    aliases: ["High School", "Secondary School", "High School Diploma"],
  },
];

function degreeAliases(degree: string): string[] {
  const match = DEGREE_LEVELS.find((level) => level.test.test(degree));
  return match ? match.aliases : [];
}

export interface AutofillProfile {
  identity: {
    full_name: string;
    first_name: string;
    last_name: string;
    preferred_name: string;
    email: string;
    phone: string;
    phone_country_code: string;
    phone_device_type: string;
  };
  location: {
    address: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    location: string;
  };
  links: {
    linkedin: string;
    github: string;
    portfolio: string;
    twitter: string;
  };
  professional: {
    current_occupation: string;
    notice_period: string;
    willing_to_relocate: string;
    citizenship: string;
    work_authorization: string;
  };
  education: AutofillEducationEntry[];
  work_experience: WorkExperienceEntry[];
  skills: string[];
  summary: string;
  resume: { filename: string; available: boolean } | null;
}

/**
 * Splits a display name into the first/last pair application forms ask for.
 * Everything after the first whitespace run is the surname, which is wrong for
 * some naming conventions — the user can correct it on the form.
 */
function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function toAutofillProfile(
  data: CandidateProfileData,
  cv: { filename: string | null; markdown: string | null },
): AutofillProfile {
  // Rows written before a field existed simply lack it, so every group is
  // defaulted rather than destructured straight out of the stored JSON.
  const candidate = data?.candidate ?? ({} as CandidateProfileData["candidate"]);
  const personal_details =
    data?.personal_details ?? ({} as CandidateProfileData["personal_details"]);
  const { first, last } = splitName(candidate.full_name ?? "");

  return {
    identity: {
      full_name: candidate.full_name ?? "",
      first_name: first,
      last_name: last,
      preferred_name: candidate.preferred_name || first,
      email: candidate.email ?? "",
      phone: candidate.phone ?? "",
      phone_country_code: personal_details.phone_country_code ?? "",
      phone_device_type: personal_details.phone_device_type ?? "",
    },
    location: {
      address: personal_details.address ?? "",
      address_line_2: personal_details.address_line_2 ?? "",
      city: personal_details.city ?? "",
      state: personal_details.state ?? "",
      postal_code: personal_details.postal_code ?? "",
      country: personal_details.country ?? "",
      location: candidate.location ?? "",
    },
    links: {
      linkedin: candidate.linkedin ?? "",
      github: candidate.github ?? "",
      portfolio: candidate.portfolio_url ?? "",
      twitter: candidate.twitter ?? "",
    },
    professional: {
      current_occupation: personal_details.current_occupation ?? "",
      notice_period: personal_details.notice_period ?? "",
      willing_to_relocate: personal_details.willing_to_relocate ?? "",
      citizenship: personal_details.citizenship ?? "",
      work_authorization: personal_details.work_authorization ?? "",
    },
    education: (Array.isArray(data?.education) ? data.education : []).map((entry) => ({
      ...entry,
      degree_aliases: degreeAliases(entry.degree ?? ""),
    })),
    work_experience: Array.isArray(data?.work_experience) ? data.work_experience : [],
    skills: Array.isArray(data?.skills) ? data.skills.filter((s) => typeof s === "string" && s.trim()) : [],
    summary: data?.ai_summary ?? "",
    // Only the parsed markdown is kept on upload, so there is no PDF to attach
    // to a form. The filename is still useful for telling the user which CV to pick.
    resume: cv.filename ? { filename: cv.filename, available: false } : null,
  };
}
