import type { CandidateProfileData } from "@/types/profile";
import { openai } from "@/lib/parser/openai-client";
import { candidateProfileDataSchema } from "@/types/schemas";

const CV_PROFILE_PROMPT = `You are an expert career assistant.

Convert CV text into:
1) clean, structured markdown CV
2) structured JSON profile data following this exact shape:
{
  "candidate": {"full_name":"","email":"","phone":"","location":"","linkedin":"","portfolio_url":"","github":"","twitter":""},
  "target_roles": {"primary": [""], "archetypes": [{"name":"", "level":"", "fit":"primary|secondary|adjacent"}]},
  "narrative": {"headline":"", "exit_story":"", "superpowers": [""], "proof_points": [{"name":"", "url":"", "hero_metric":""}]},
  "compensation": {"target_range":"", "currency":"USD", "minimum":"", "location_flexibility":""},
  "location": {"country":"", "city":"", "timezone":"", "visa_status":""}
}

Rules:
- Return JSON object only.
- Keep facts grounded in the CV text. If unknown, use empty string or empty array.
- Use concise markdown formatting for CV sections.
- Do not invent confidential details.
- Use valid UTF-8 text.

JSON output shape:
{
  "cv_markdown": "...",
  "profile_data": { ... }
}`;

interface GenerateResult {
  cv_markdown: string;
  profile_data: CandidateProfileData;
}

export async function generateProfileFromCvText(cvText: string): Promise<GenerateResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CV_PROFILE_PROMPT },
      { role: "user", content: cvText },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    cv_markdown?: string;
    profile_data?: unknown;
  };

  const profileParsed = candidateProfileDataSchema.safeParse(parsed.profile_data);
  if (!profileParsed.success) {
    throw new Error("Failed to generate valid profile data from CV");
  }

  return {
    cv_markdown: parsed.cv_markdown?.trim() || "",
    profile_data: profileParsed.data,
  };
}
