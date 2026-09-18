export const JOB_KEYWORDS = [
  // Application status
  "application",
  "applied",
  "shortlisted",
  "under review",
  "next steps",
  "moving forward",
  "proceed",
  "unsuccessful",
  "not successful",
  "thank you for applying",
  "we regret to inform",
  "regretted",
  "rejected",

  // Interview & assessment
  "interview",
  "assessment",
  "screening",
  "coding challenge",
  "technical test",
  "take-home",
  "skills test",
  "background check",
  "reference check",

  // People & roles
  "recruiter",
  "talent acquisition",
  "hiring manager",
  "candidate",

  // Job terms
  "job",
  "role",
  "position",
  "vacancy",
  "career",
  "opportunity",
  "hiring",
  "employment",
  "onboarding",
  "offer",
  "start date",
  "notice period",
  "probation",

  // Positive signals
  "congratulations",
  "welcome aboard",
];

/**
 * Keywords for mail the user sent. Deliberately narrower than JOB_KEYWORDS:
 * "thanks", "interview" and "offer" are everyday words in outgoing mail, and
 * matching them would drag in every note the user wrote to a colleague. These
 * are phrases that only really appear when someone is applying for something.
 */
export const SENT_JOB_KEYWORDS = [
  "applying for",
  "application for",
  "apply for the",
  "my application",
  "my resume",
  "my cv",
  "cover letter",
  "attached my",
  "for the position",
  "for the role",
  "interested in the role",
  "interested in the position",
  "express my interest",
  "candidacy",
];

export const ATS_DOMAINS = [
  "jobstreet.com.sg",
  "mycareersfuture.gov.sg",
  "glints.com",
  "nodeflair.io",
  "fastjobs.sg",
  "jobscentral.com.sg",
  "hiredly.com",
  "linkedin.com",
];
