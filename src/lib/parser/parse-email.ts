import { openai } from "./openai-client";
import { AI_MODELS } from "@/lib/ai/models";
import { SYSTEM_PROMPT } from "./prompt";
import { aiParseResultSchema } from "@/types/schemas";
import type { AIParseResult } from "@/types/parse-result";
import type { EmailDirection } from "@/types/email";

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

// Nothing upstream caps body length, and a newsletter-style HTML email can decode
// to tens of thousands of tokens. Status and company live in the first screenful,
// so the head is the part worth paying for.
const MAX_BODY_CHARS = 8000;

interface EmailInput {
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  direction: EmailDirection;
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
  let bodyText = email.bodyText;
  if (bodyText.length > MAX_BODY_CHARS) {
    console.log(
      `[parser] Truncated body ${bodyText.length} → ${MAX_BODY_CHARS} chars: "${email.subject}"`
    );
    bodyText = bodyText.slice(0, MAX_BODY_CHARS);
  }

  // Direction first: on a sent email the From is the user, and the company is in
  // the To header. The model needs to know that before reading either.
  const userMessage =
    `Direction: ${email.direction}\n` +
    `From: ${email.fromName} <${email.fromEmail}>\n` +
    `To: ${email.toEmail}\n` +
    `Subject: ${email.subject}\n\n${bodyText}`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.emailParse,
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
