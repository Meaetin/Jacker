import type { CandidateProfileData } from "@/types/profile";
import { openai } from "@/lib/parser/openai-client";
import { normalizeProfileData } from "./defaults";

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
  inputTokens: number;
  outputTokens: number;
}

const MAX_CV_INPUT_CHARS = 20000;

export async function generateProfileFromCvText(cvText: string): Promise<GenerateResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const cleaned = cvText.replace(/\u0000/g, "").trim();
  const truncatedInput =
    cleaned.length > MAX_CV_INPUT_CHARS
      ? `${cleaned.slice(0, MAX_CV_INPUT_CHARS)}\n\n[CV text truncated for processing]`
      : cleaned;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 2200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CV_PROFILE_PROMPT },
      { role: "user", content: truncatedInput },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const parsed = JSON.parse(raw) as {
    cv_markdown?: string;
    profile_data?: unknown;
  };

  return {
    cv_markdown: parsed.cv_markdown?.trim() || "",
    profile_data: normalizeProfileData(parsed.profile_data),
    inputTokens,
    outputTokens,
  };
}
