import { insertParseLog } from "@/lib/db/parse-logs";
import { PROMPT_VERSION } from "./prompt";

interface LogParseResultParams {
  userId: string;
  rawEmailId: string;
  rawResponse: string;
  parsedSuccess: boolean;
  errorMessage?: string;
}

export async function logParseResult({
  userId,
  rawEmailId,
  rawResponse,
  parsedSuccess,
  errorMessage,
}: LogParseResultParams) {
  try {
    await insertParseLog({
      user_id: userId,
      raw_email_id: rawEmailId,
      prompt_version: PROMPT_VERSION,
      raw_response: rawResponse ? JSON.parse(rawResponse) : null,
      parsed_success: parsedSuccess,
      error_message: errorMessage ?? null,
    });
  } catch {
    // Log failures should not break the pipeline
  }
}
