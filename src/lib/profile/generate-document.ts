import type { CandidateProfileData, DocumentType } from "@/types/profile";
import type OpenAI from "openai";
import { openai } from "@/lib/parser/openai-client";
import { AI_MODELS } from "@/lib/ai/models";

const SYSTEM_PROMPTS: Record<DocumentType, string> = {
  cover_letter: `You write compelling, personalized cover letters.

You will receive:
- Candidate CV in markdown
- Candidate profile data (AI summary, work experience, education, personal details)
- Job description
- Job fit analysis (score, matches, gaps, recommendations)

Write a cover letter that:
- Opens with a hook tied to the company or role
- Cites 2-3 concrete achievements from the candidate's work experience and CV
- Addresses gaps honestly but frames them as growth areas or learning opportunities
- Reflects the candidate's background and matches as captured in the AI summary
- Is 3-4 paragraphs, professional but warm
- Does NOT use generic filler phrases like "I am writing to express my interest"
- Addresses the hiring manager if the company name is known
- Includes a professional sign-off with the candidate's name

IMPORTANT: If the user provides custom instructions, you MUST follow them. Custom instructions override any default guideline above.

Return JSON only: { "content_md": "the cover letter in markdown" }`,

  application_email: `You write concise, effective application outreach emails.

You will receive:
- Candidate CV in markdown
- Candidate profile data (AI summary, work experience, education, personal details)
- Job description
- Job fit analysis (score, matches)

Write an application email that:
- Has a clear, specific subject line (first line of output, prefixed with "Subject: ")
- Opens with why this role specifically interests the candidate
- Highlights 1-2 concrete achievements with quantified results from the candidate's work experience or CV
- Is brief (150-250 words in the body)
- Sounds human and confident, not corporate or robotic
- Closes with a clear call to action (meeting, call, next steps)
- Includes a professional sign-off

IMPORTANT: If the user provides custom instructions, you MUST follow them. Custom instructions override any default guideline above.

Return JSON only: { "content_md": "Subject: ...\\n\\nBody of the email..." }`,
};

interface GenerateDocumentInput {
  documentType: DocumentType;
  cvMarkdown: string;
  profileData: CandidateProfileData;
  jobDescription: string;
  analysisResult: {
    score: number;
    band: string;
    matches_md: string;
    gaps_md: string;
    recommendations_md: string;
    overall_feedback_md: string;
  };
  customInstructions?: string;
}

interface GenerateDocumentOutput {
  content_md: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generateDocument(
  input: GenerateDocumentInput,
): Promise<GenerateDocumentOutput> {
  const systemPrompt = SYSTEM_PROMPTS[input.documentType];

  const userMessage: Record<string, unknown> = {
    cv_markdown: input.cvMarkdown,
    profile_data: input.profileData,
    job_description: input.jobDescription,
    analysis: input.analysisResult,
  };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userMessage, null, 2) },
  ];

  // Custom instructions go as a separate user message so the model treats them as a high-priority directive
  if (input.customInstructions?.trim()) {
    messages.push({
      role: "user",
      content: `Custom instructions — follow these strictly:\n\n${input.customInstructions.trim()}`,
    });
  }

  const response = await openai.chat.completions.create({
    model: AI_MODELS.documentGeneration,
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const parsed = JSON.parse(raw);

  if (!parsed.content_md || typeof parsed.content_md !== "string") {
    throw new Error("Failed to generate valid document content");
  }

  return {
    content_md: parsed.content_md,
    inputTokens,
    outputTokens,
  };
}
