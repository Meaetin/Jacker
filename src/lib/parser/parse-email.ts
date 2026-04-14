import { openai } from "./openai-client";
import { SYSTEM_PROMPT } from "./prompt";
import { aiParseResultSchema } from "@/types/schemas";
import type { AIParseResult } from "@/types/parse-result";

const NOT_JOB_RELATED: AIParseResult = {
  is_job_related: false,
  company_from_subject: null,
  company_from_body: null,
  company_from_email: null,
  role: null,
  status: null,
  status_confidence: null,
  email_type: null,
  interview_date: null,
  interview_time: null,
  location: null,
  notes: null,
};

interface EmailInput {
  subject: string;
  fromEmail: string;
  fromName: string;
  bodyText: string;
}

export async function parseJobEmail(email: EmailInput): Promise<{
  result: AIParseResult;
  rawResponse: string;
  success: boolean;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}> {
  const userMessage = `From: ${email.fromName} <${email.fromEmail}>\nSubject: ${email.subject}\n\n${email.bodyText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawResponse = response.choices[0]?.message?.content ?? "";
    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;

    const parsed = JSON.parse(rawResponse);
    const validated = aiParseResultSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        result: NOT_JOB_RELATED,
        rawResponse,
        success: false,
        inputTokens,
        outputTokens,
        error: validated.error.message,
      };
    }

    return {
      result: validated.data,
      rawResponse,
      success: true,
      inputTokens,
      outputTokens,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown parse error";
    return {
      result: NOT_JOB_RELATED,
      rawResponse: "",
      success: false,
      inputTokens: 0,
      outputTokens: 0,
      error: message,
    };
  }
}
