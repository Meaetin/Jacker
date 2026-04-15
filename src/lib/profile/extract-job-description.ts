import { openai } from "@/lib/parser/openai-client";
import { extractedDescriptionSchema } from "@/types/schemas";

const EXTRACTION_PROMPT = `You extract structured job posting data from raw web page text.

The input may contain navigation menus, cookie notices, privacy policy links, footer content, sidebar recommendations, "similar jobs" sections, login/signup prompts, and other irrelevant content. Your job is to extract ONLY the actual job posting content.

Return JSON only with this shape:
{
  "company_overview": "string or null — brief description of the company if mentioned",
  "role_summary": "string or null — what the role is about, 1-3 sentences",
  "responsibilities": "string or null — markdown bullet list of day-to-day duties and deliverables",
  "requirements": "string or null — markdown bullet list of must-have qualifications",
  "nice_to_have": "string or null — markdown bullet list of preferred/nice-to-have qualifications",
  "benefits": "string or null — markdown bullet list of compensation, perks, and benefits",
  "location_info": "string or null — remote/hybrid/onsite, office location, travel requirements",
  "extracted_company_name": "string or null — hiring company name",
  "extracted_job_title": "string or null — role/title of the position"
}

Rules:
- Extract ONLY information that is actually present in the job posting. Return null for any section not mentioned.
- Do NOT invent, infer, or fabricate content. Preserve the original wording where possible.
- Ignore navigation menus, headers, footers, cookie banners, sidebar content, "similar jobs", "people also viewed", social sharing buttons, and any non-job-posting text.
- If the input is already a clean, well-structured job posting, preserve it closely rather than restructuring.
- No extra keys.`;

interface ExtractResult {
  cleanedText: string;
  companyName: string | null;
  jobTitle: string | null;
  inputTokens: number;
  outputTokens: number;
}

export async function extractJobDescription(rawText: string): Promise<ExtractResult> {
  const truncated = rawText.length > 20000
    ? rawText.slice(0, 20000) + "\n\n[... content truncated for processing ...]"
    : rawText;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      {
        role: "user",
        content: `Extract the job posting from this raw page text:\n\n${truncated}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  const parsed = JSON.parse(raw);
  const validated = extractedDescriptionSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("Failed to extract valid job description");
  }

  const data = validated.data;
  const cleanedText = buildCleanedText(data);

  return {
    cleanedText,
    companyName: data.extracted_company_name,
    jobTitle: data.extracted_job_title,
    inputTokens,
    outputTokens,
  };
}

function buildCleanedText(data: Record<string, string | null>): string {
  const sections: string[] = [];

  if (data.role_summary) {
    sections.push(`## Role Summary\n\n${data.role_summary}`);
  }
  if (data.company_overview) {
    sections.push(`## About the Company\n\n${data.company_overview}`);
  }
  if (data.responsibilities) {
    sections.push(`## Responsibilities\n\n${data.responsibilities}`);
  }
  if (data.requirements) {
    sections.push(`## Requirements\n\n${data.requirements}`);
  }
  if (data.nice_to_have) {
    sections.push(`## Nice to Have\n\n${data.nice_to_have}`);
  }
  if (data.benefits) {
    sections.push(`## Benefits\n\n${data.benefits}`);
  }
  if (data.location_info) {
    sections.push(`## Location\n\n${data.location_info}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}
