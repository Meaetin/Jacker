import { parseJobEmail } from "@/lib/parser/parse-email";
import { logParseResult } from "@/lib/parser/parse-log";
import { upsertApplication } from "@/lib/ingest/upsert-application";
import { trackUsage } from "@/lib/db/user-usage";
import { createClient } from "@/utils/supabase/server";
import type { RawEmail } from "@/types/email";

export interface ReparseResult {
  total: number;
  parsed: number;
  skipped: number;
  newApplications: number;
  updatedApplications: number;
  errors: string[];
}

export async function runReparsePipeline(
  userId: string
): Promise<ReparseResult> {
  const result: ReparseResult = {
    total: 0,
    parsed: 0,
    skipped: 0,
    newApplications: 0,
    updatedApplications: 0,
    errors: [],
  };

  console.log(`[reparse] Starting reparse for user ${userId}`);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const supabase = await createClient();

  // Only fetch emails that haven't been successfully parsed yet
  const { data: rawEmails, error: fetchError } = await supabase
    .from("raw_emails")
    .select()
    .eq("user_id", userId)
    .in("parse_status", ["pending", "failed"])
    .order("received_at", { ascending: false });

  if (fetchError) {
    console.error("[reparse] Failed to fetch raw emails:", fetchError.message);
    result.errors.push(`Failed to fetch raw emails: ${fetchError.message}`);
    return result;
  }

  if (!rawEmails || rawEmails.length === 0) {
    console.log("[reparse] No unparsed emails found");
    return result;
  }

  result.total = rawEmails.length;
  console.log(`[reparse] Found ${rawEmails.length} unparsed emails`);

  for (let i = 0; i < rawEmails.length; i++) {
    const email = rawEmails[i] as RawEmail;

    const bodyText = email.body_text || email.snippet;

    if (!bodyText) {
      result.skipped++;
      continue;
    }

    try {
      console.log(`[reparse] [${i + 1}/${rawEmails.length}] Parsing: "${email.subject}"`);

      const parseOutput = await parseJobEmail({
        subject: email.subject ?? "",
        fromEmail: email.from_email ?? "",
        fromName: email.from_name ?? "",
        bodyText,
      });

      totalInputTokens += parseOutput.inputTokens;
      totalOutputTokens += parseOutput.outputTokens;
      result.parsed++;

      // Update parse_status on raw_email
      if (parseOutput.success) {
        await supabase
          .from("raw_emails")
          .update({ parse_status: "parsed", parse_error: null })
          .eq("id", email.id);
      } else {
        await supabase
          .from("raw_emails")
          .update({ parse_status: "failed", parse_error: parseOutput.error ?? null })
          .eq("id", email.id);
      }

      // Log parse result
      await logParseResult({
        userId,
        rawEmailId: email.id,
        rawResponse: parseOutput.rawResponse,
        parsedSuccess: parseOutput.success,
        errorMessage: parseOutput.error,
      });

      // Upsert application if job-related and actionable
      const isLowSignal = parseOutput.result.email_type === "job_alert" || parseOutput.result.email_type === "application_viewed";
      if (parseOutput.result.is_job_related && !isLowSignal) {
        const upsertResult = await upsertApplication(
          parseOutput.result,
          email.id,
          email.gmail_thread_id,
          userId,
          email.received_at ?? null
        );

        const company = parseOutput.result.company_from_email ?? parseOutput.result.company_from_body;
        if (upsertResult.outcome === "inserted") {
          console.log(`[reparse] New application: ${company} - ${parseOutput.result.role} (${parseOutput.result.status})`);
          result.newApplications++;
        } else if (upsertResult.outcome === "updated") {
          console.log(`[reparse] Updated application: ${company} - ${parseOutput.result.role} → ${parseOutput.result.status}`);
          result.updatedApplications++;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[reparse] Error parsing email ${email.id}: ${msg}`);
      result.errors.push(`Error parsing email ${email.id}: ${msg}`);
      await supabase
        .from("raw_emails")
        .update({ parse_status: "failed", parse_error: msg })
        .eq("id", email.id);
    }
  }

  if (result.parsed > 0) {
    await trackUsage({
      action: "reparse",
      user_id: userId,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      emails_scanned: result.parsed,
    });
  }

  console.log(`[reparse] Complete. Total: ${result.total}, Parsed: ${result.parsed}, Skipped: ${result.skipped}, New apps: ${result.newApplications}, Errors: ${result.errors.length}`);
  return result;
}
