import type { CandidateProfileData } from "@/types/profile";
import { openai } from "@/lib/parser/openai-client";
import { jobAnalysisResultSchema } from "@/types/schemas";

const JOB_ANALYSIS_PROMPT = `You evaluate candidate-job fit.

You will receive:
- Candidate CV in markdown
- Candidate profile data in JSON
- Job description text

Return JSON only with this shape:
{
  "company_name": "string or null",
  "job_title": "string or null",
  "score": 0,
  "strengths_md": "markdown bullets",
  "gaps_md": "markdown bullets",
  "recommendations_md": "markdown bullets",
  "overall_feedback_md": "short markdown paragraph"
}

Rules:
- company_name: extract the hiring company from the provided job description text only. Return null if unclear.
- job_title: extract the role title from the provided job description text only. Return null if unclear.
- score must be an integer 0-100.
- Be evidence-based using candidate data and the job description.
- strengths_md and gaps_md should each include at least 3 bullet points when possible.
- recommendations should be specific and practical.
- No extra keys.`;

interface AnalyzeInput {
  cvMarkdown: string;
  profileData: CandidateProfileData;
  jobDescription: string;
}

export async function analyzeJobFit(input: AnalyzeInput) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JOB_ANALYSIS_PROMPT },
      {
        role: "user",
        content: JSON.stringify(
          {
            cv_markdown: input.cvMarkdown,
            profile_data: input.profileData,
            job_description: input.jobDescription,
          },
          null,
          2,
        ),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const parsed = JSON.parse(raw);
  const validated = jobAnalysisResultSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("Failed to generate valid job-fit analysis");
  }

  return {
    ...validated.data,
    inputTokens,
    outputTokens,
  };
}
