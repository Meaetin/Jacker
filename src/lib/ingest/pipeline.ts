import { fetchRecentEmails } from "@/lib/gmail/fetch-emails";
import { createGmailClient } from "@/lib/gmail/client";
import { isLikelyJobRelated } from "@/lib/filter/is-job-related";
import { parseJobEmail } from "@/lib/parser/parse-email";
import { logParseResult } from "@/lib/parser/parse-log";
import { storeIfNew } from "@/lib/ingest/store-raw-email";
import { upsertApplication } from "@/lib/ingest/upsert-application";
import { insertUserUsage } from "@/lib/db/user-usage";
import { createClient } from "@/utils/supabase/server";

export interface IngestResult {
  fetched: number;
  newEmails: number;
  parsed: number;
  newApplications: number;
  updatedApplications: number;
  errors: string[];
}

export async function runIngestPipeline(
  userId: string,
  fromDate?: Date
): Promise<IngestResult> {
  const result: IngestResult = {
    fetched: 0,
    newEmails: 0,
    parsed: 0,
    newApplications: 0,
    updatedApplications: 0,
    errors: [],
  };

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let emailsScanned = 0;

  console.log(`[ingest] Starting pipeline for user ${userId}`);

  // Get user's Gmail tokens
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("user_tokens")
    .select()
    .eq("user_id", userId)
    .single();

  if (!tokens) {
    console.error("[ingest] No Gmail tokens found for user");
    result.errors.push("No Gmail tokens found for user");
    return result;
  }

  const auth = createGmailClient(
    tokens.gmail_access_token ?? "",
    tokens.gmail_refresh_token
  );

  // Step 1: Fetch recent emails
  const afterDate = fromDate ?? (tokens.last_sync_at ? new Date(tokens.last_sync_at) : undefined);
  if (afterDate) {
    console.log(`[ingest] Fetching emails since ${afterDate.toISOString()}`);
  } else {
    console.log("[ingest] No previous sync, fetching last 30 days");
  }

  let emails;
  try {
    emails = await fetchRecentEmails(auth, 200, afterDate, userId);
    result.fetched = emails.length;
    console.log(`[ingest] Fetched ${emails.length} emails`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ingest] Gmail fetch failed: ${msg}`);
    result.errors.push(`Gmail fetch failed: ${msg}`);
    return result;
  }

  // Step 2: Process each email
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    let rawEmailId: string | undefined;
    try {
      // Store raw email (dedup by gmail_message_id)
      const { id, isNew } = await storeIfNew(email, userId);
      rawEmailId = id;
      if (!isNew) continue;
      result.newEmails++;

      // Step 3: Pre-filter
      if (!isLikelyJobRelated(email)) {
        console.log(`[ingest] [${i + 1}/${emails.length}] Skipped (not job-related): "${email.subject}"`);
        await supabase
          .from("raw_emails")
          .update({ parse_status: "not_job_related" })
          .eq("id", rawEmailId);
        continue;
      }

      // Step 4: AI parsing
      console.log(`[ingest] [${i + 1}/${emails.length}] Parsing: "${email.subject}"`);
      emailsScanned++;
      const parseOutput = await parseJobEmail({
        subject: email.subject,
        fromEmail: email.from,
        fromName: email.fromName,
        bodyText: email.bodyText,
      });

      totalInputTokens += parseOutput.inputTokens;
      totalOutputTokens += parseOutput.outputTokens;
      result.parsed++;

      // Step 5: Log parse result + update parse_status on raw_email
      if (parseOutput.success) {
        await supabase
          .from("raw_emails")
          .update({ parse_status: "parsed" })
          .eq("id", rawEmailId);
      } else {
        await supabase
          .from("raw_emails")
          .update({ parse_status: "failed", parse_error: parseOutput.error ?? null })
          .eq("id", rawEmailId);
      }

      await logParseResult({
        userId,
        rawEmailId,
        rawResponse: parseOutput.rawResponse,
        parsedSuccess: parseOutput.success,
        errorMessage: parseOutput.error,
      });

      // Step 6: Upsert application if job-related and actionable
      const isLowSignal =
        parseOutput.result.email_type === "job_alert" ||
        parseOutput.result.email_type === "application_viewed";
      if (parseOutput.result.is_job_related && !isLowSignal) {
        const upsertResult = await upsertApplication(
          parseOutput.result,
          rawEmailId,
          email.threadId,
          userId,
          email.receivedAt
        );

        const company = parseOutput.result.company_from_email ?? parseOutput.result.company_from_body;
        if (upsertResult.outcome === "inserted") {
          console.log(`[ingest] New application: ${company} - ${parseOutput.result.role} (${parseOutput.result.status})`);
          result.newApplications++;
        } else if (upsertResult.outcome === "updated") {
          console.log(`[ingest] Updated application: ${company} - ${parseOutput.result.role} → ${parseOutput.result.status}`);
          result.updatedApplications++;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ingest] Error processing email ${email.id}: ${msg}`);
      result.errors.push(`Error processing email ${email.id}: ${msg}`);
      if (rawEmailId) {
        await supabase
          .from("raw_emails")
          .update({ parse_status: "failed", parse_error: msg })
          .eq("id", rawEmailId);
      }
    }
  }

  // Update last_sync_at
  await supabase
    .from("user_tokens")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId);

  // Record OpenAI usage for this run
  if (emailsScanned > 0) {
    await insertUserUsage({
      user_id: userId,
      action_type: "email_parse",
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      emails_retrieved: result.fetched,
      emails_scanned: emailsScanned,
    });
  }

  console.log(`[ingest] Pipeline complete. Fetched: ${result.fetched}, New: ${result.newEmails}, Parsed: ${result.parsed}, New apps: ${result.newApplications}, Errors: ${result.errors.length}`);
  return result;
}
