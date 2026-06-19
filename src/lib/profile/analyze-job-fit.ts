import { openai } from "@/lib/parser/openai-client";
import { AI_MODELS } from "@/lib/ai/models";
import { jobAnalysisResultSchema } from "@/types/schemas";

const JOB_ANALYSIS_PROMPT = `You evaluate candidate-job fit.

You will receive:
- Candidate CV in markdown
- Job description text

Return JSON only with this shape:
{
  "company_name": "string or null",
  "job_title": "string or null",
  "score": 0,
  "matches_md": "markdown bullets",
  "gaps_md": "markdown bullets",
  "recommendations_md": "markdown bullets",
  "overall_feedback_md": "short markdown paragraph"
}

Rules:
- company_name: extract the hiring company from the provided job description text only. Return null if unclear.
- job_title: extract the role title from the provided job description text only. Return null if unclear.
- score must be an integer 0-100.
- Be evidence-based: ground every bullet in the candidate's actual CV and the job description.

matches_md — concrete capabilities the candidate HAS, inferred from their work experience, skills, tools, and achievements, mapped against what the role wants. Each bullet must name a specific capability and tie it to evidence. Cover dimensions such as:
  - Years of experience (e.g. "8+ years of backend engineering, matching the senior level required").
  - Leadership / ownership (e.g. "Led a 5-engineer team through a monolith-to-microservices migration").
  - Specific tool / technology familiarity (e.g. "Hands-on with Kafka, Redis, and Kubernetes, all listed in the requirements").
  - Quantified achievements relevant to the role (e.g. "Cut p99 latency by 40%, relevant to the performance focus of this role").
  Do not be vague — always name the concrete skill, tool, or accomplishment.

gaps_md — requirements from the job description the candidate does NOT demonstrate. Each bullet MUST name the specific tool, technology, framework, or trait that is missing. Never write a vague gap.
  - Bad: "Limited experience with back-end microservices."
  - Good: "No demonstrated experience with gRPC-based microservices in Go, which the role lists as a core requirement."
  - Bad: "Could improve cloud skills."
  - Good: "No evidence of AWS Lambda or serverless experience, which the job requires."

recommendations_md — there is NO limit on the number of bullets. List every specific, actionable step the candidate should take to close the gaps and strengthen their candidacy. Be concrete: name the exact tools/skills to learn, the specific achievements or projects to surface, certifications to pursue, or talking points to prepare. Avoid generic advice like "gain more experience".

- No extra keys.`;

interface AnalyzeInput {
  cvMarkdown: string;
  jobDescription: string;
}

export async function analyzeJobFit(input: AnalyzeInput) {
  const response = await openai.chat.completions.create({
    model: AI_MODELS.jobFitAnalysis,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: JOB_ANALYSIS_PROMPT },
      {
        role: "user",
        content: JSON.stringify(
          {
            cv_markdown: input.cvMarkdown,
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
