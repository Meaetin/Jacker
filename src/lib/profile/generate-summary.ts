import type { CandidateProfileData } from "@/types/profile";
import { openai } from "@/lib/parser/openai-client";
import { AI_MODELS } from "@/lib/ai/models";

const SUMMARY_PROMPT = `You are an expert career assistant.

You will receive a candidate's structured profile data (JSON) and their CV in markdown.

Write an "ai_summary": a thorough, neutral third-person breakdown of who the candidate is — their background, seniority, domain expertise, core skills, notable achievements, and what kind of work they are suited for. Write it so an assistant could use it to answer questions about the candidate. 1-3 paragraphs.

Rules:
- Ground every claim in the provided data. Do not invent facts.
- Return JSON only: { "ai_summary": "..." }
- Use valid UTF-8 text.`;

const MAX_CV_INPUT_CHARS = 20000;

interface GenerateSummaryResult {
  ai_summary: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generateProfileSummary(
  profileData: CandidateProfileData,
  cvMarkdown: string,
): Promise<GenerateSummaryResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const cleanedCv = cvMarkdown.replace(/\u0000/g, "").trim();
  const truncatedCv =
    cleanedCv.length > MAX_CV_INPUT_CHARS
      ? `${cleanedCv.slice(0, MAX_CV_INPUT_CHARS)}\n\n[CV text truncated for processing]`
      : cleanedCv;

  const response = await openai.chat.completions.create({
    model: AI_MODELS.profileSummary,
    temperature: 0.3,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SUMMARY_PROMPT },
      {
        role: "user",
        content: JSON.stringify(
          { profile_data: profileData, cv_markdown: truncatedCv },
          null,
          2,
        ),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const parsed = JSON.parse(raw) as { ai_summary?: unknown };

  return {
    ai_summary: typeof parsed.ai_summary === "string" ? parsed.ai_summary.trim() : "",
    inputTokens,
    outputTokens,
  };
}
