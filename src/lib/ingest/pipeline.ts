import { fetchRecentEmails } from "@/lib/gmail/fetch-emails";
import { createGmailClient } from "@/lib/gmail/client";
import { isLikelyJobRelated } from "@/lib/filter/is-job-related";
import { parseJobEmail } from "@/lib/parser/parse-email";
import { logParseResult } from "@/lib/parser/parse-log";
import { storeIfNew } from "@/lib/ingest/store-raw-email";
import { upsertApplication } from "@/lib/ingest/upsert-application";
import { trackUsage } from "@/lib/db/user-usage";
import { createAdminClient } from "@/utils/supabase/admin";
import { mapWithConcurrency } from "@/utils/concurrency";
import type { GmailMessage } from "@/types/email";

// Each parse is one OpenAI call plus a couple of per-email Supabase writes.
// Held at 8 to match the Gmail fetch pool — gpt-4.1-nano's limits are far higher.
const PARSE_CONCURRENCY = 8;

// Emails per run. Sized to finish inside the 300s serverless ceiling; anything
// over this is reported as `remaining` and picked up by the next run rather than
// being dropped.
const EMAILS_PER_RUN = 150;

/** An email that survived dedup and the pre-filter, and has been parsed. */
interface ParsedEmail {
  email: GmailMessage;
  rawEmailId: string;
  parseOutput: Awaited<ReturnType<typeof parseJobEmail>>;
}

export interface IngestResult {
  fetched: number;
  newEmails: number;
  parsed: number;
  newApplications: number;
  updatedApplications: number;
  /** Emails this search matched that the per-run cap left for a later run. */
  remaining: number;
  errors: string[];
}

export interface IngestProgress {
  total: number;
  processed: number;
  newApplications: number;
  updatedApplications: number;
}

export interface IngestOptions {
  fromDate?: Date;
  onProgress?: (progress: IngestProgress) => void | Promise<void>;
}

export async function runIngestPipeline(
  userId: string,
  options: IngestOptions = {}
): Promise<IngestResult> {
  const { fromDate, onProgress } = options;
  const result: IngestResult = {
    fetched: 0,
    newEmails: 0,
    parsed: 0,
    newApplications: 0,
    updatedApplications: 0,
    remaining: 0,
    errors: [],
  };

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let emailsScanned = 0;

  console.log(`[ingest] Starting pipeline for user ${userId}`);

  // Cron runs this with no signed-in user, so every query below goes through
  // the service-role client, scoped by the userId passed in.
  const admin = createAdminClient();
  const { data: tokens } = await admin
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
    tokens.gmail_refresh_token,
    userId
  );

  // Capture the watermark BEFORE fetching. Saving the finish time would skip
  // any email that arrives while this run is parsing (its received time would
  // predate the watermark), so the next sync starts from when scanning began.
  const syncStartedAt = new Date().toISOString();

  // Step 1: Fetch recent emails
  const afterDate = fromDate ?? (tokens.last_sync_at ? new Date(tokens.last_sync_at) : undefined);
  if (afterDate) {
    console.log(`[ingest] Fetching emails since ${afterDate.toISOString()}`);
  } else {
    console.log("[ingest] No previous sync, fetching last 30 days");
  }

  let emails;
  try {
    const fetched = await fetchRecentEmails(auth, EMAILS_PER_RUN, afterDate, userId, admin);
    emails = fetched.emails;
    result.remaining = fetched.remaining;
    result.fetched = emails.length;
    console.log(`[ingest] Fetched ${emails.length} emails, ${result.remaining} left for a later run`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ingest] Gmail fetch failed: ${msg}`);
    result.errors.push(`Gmail fetch failed: ${msg}`);
    return result;
  }

  // Report total up-front so the UI can show "Parsing 0 of N".
  const report = (i: number) =>
    onProgress?.({
      total: emails.length,
      processed: i,
      newApplications: result.newApplications,
      updatedApplications: result.updatedApplications,
    });
  await report(0);

  // Step 2: Store, pre-filter and parse every email.
  //
  // These steps only ever touch that email's own rows, so they run in parallel —
  // the AI call is where nearly all the wall-clock goes. The application upserts,
  // which do share state across emails, are deferred to phase 2 below.
  let processed = 0;
  const parsedEmails = await mapWithConcurrency(
    emails,
    PARSE_CONCURRENCY,
    async (email, i): Promise<ParsedEmail | null> => {
      let rawEmailId: string | undefined;
      try {
        // Store raw email (dedup by gmail_message_id)
        const { id, isNew } = await storeIfNew(email, userId, admin);
        rawEmailId = id;
        if (!isNew) return null;
        result.newEmails++;

        // Step 3: Pre-filter
        if (!isLikelyJobRelated(email)) {
          console.log(`[ingest] [${i + 1}/${emails.length}] Skipped (not job-related): "${email.subject}"`);
          await admin
            .from("raw_emails")
            .update({ parse_status: "not_job_related" })
            .eq("id", rawEmailId);
          return null;
        }

        // Step 4: AI parsing
        console.log(`[ingest] [${i + 1}/${emails.length}] Parsing: "${email.subject}"`);
        emailsScanned++;
        const parseOutput = await parseJobEmail({
          subject: email.subject,
          fromEmail: email.from,
          fromName: email.fromName,
          toEmail: email.to,
          direction: email.direction,
          bodyText: email.bodyText,
        });

        totalInputTokens += parseOutput.inputTokens;
        totalOutputTokens += parseOutput.outputTokens;
        result.parsed++;

        // Step 5: Log parse result + update parse_status on raw_email
        if (parseOutput.success) {
          await admin
            .from("raw_emails")
            .update({ parse_status: "parsed" })
            .eq("id", rawEmailId);
        } else {
          await admin
            .from("raw_emails")
            .update({ parse_status: "failed", parse_error: parseOutput.error ?? null })
            .eq("id", rawEmailId);
        }

        await logParseResult({
          db: admin,
          userId,
          rawEmailId,
          rawResponse: parseOutput.rawResponse,
          parsedSuccess: parseOutput.success,
          errorMessage: parseOutput.error,
        });

        return { email, rawEmailId, parseOutput };
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[ingest] Error processing email ${email.id}: ${msg}`);
        result.errors.push(`Error processing email ${email.id}: ${msg}`);
        if (rawEmailId) {
          await admin
            .from("raw_emails")
            .update({ parse_status: "failed", parse_error: msg })
            .eq("id", rawEmailId);
        }
        return null;
      } finally {
        await report(++processed);
      }
    }
  );

  // Step 6: Upsert applications, oldest email first.
  //
  // Sequential on purpose. Two emails belonging to the same application would
  // otherwise race on read-modify-write, and two that both create one would each
  // insert. The explicit sort means correctness no longer rests on the order
  // Gmail happened to return.
  const toUpsert = parsedEmails
    .filter((parsed): parsed is ParsedEmail => parsed !== null)
    .filter(({ parseOutput }) => {
      const isLowSignal =
        parseOutput.result.email_type === "job_alert" ||
        parseOutput.result.email_type === "application_viewed";
      return parseOutput.result.is_job_related && !isLowSignal;
    })
    .sort((a, b) => a.email.receivedAt.localeCompare(b.email.receivedAt));

  for (const { email, rawEmailId, parseOutput } of toUpsert) {
    try {
      const upsertResult = await upsertApplication(
        parseOutput.result,
        rawEmailId,
        email.threadId,
        userId,
        email.receivedAt,
        admin
      );

      const company = parseOutput.result.company_from_email ?? parseOutput.result.company_from_body;
      if (upsertResult.outcome === "inserted") {
        console.log(`[ingest] New application: ${company} - ${parseOutput.result.role} (${parseOutput.result.status})`);
        result.newApplications++;
      } else if (upsertResult.outcome === "updated") {
        console.log(`[ingest] Updated application: ${company} - ${parseOutput.result.role} → ${parseOutput.result.status}`);
        result.updatedApplications++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ingest] Error upserting from email ${email.id}: ${msg}`);
      result.errors.push(`Error upserting from email ${email.id}: ${msg}`);
      // Leave it failed so runReparsePipeline sweeps it up later.
      await admin
        .from("raw_emails")
        .update({ parse_status: "failed", parse_error: msg })
        .eq("id", rawEmailId);
    }
    await report(processed);
  }

  // Only advance the watermark once this search window is drained. Moving it
  // after a capped run would push last_sync_at past emails we never fetched, and
  // the next search starts from the watermark — so they would never be seen
  // again. Leaving it put means the next run re-searches the same window and
  // picks up where this one stopped (raw_emails already excludes what was done).
  //
  // The newEmails guard stops a hold from wedging forever. An email that fails
  // to store is never in raw_emails, so it stays "new" and keeps counting toward
  // `remaining` on every run. If a whole run stored nothing, holding the
  // watermark just repeats the same failure tomorrow — advance instead.
  const storedSomething = result.newEmails > 0;
  if (result.remaining === 0 || !storedSomething) {
    if (result.remaining > 0) {
      console.warn(
        `[ingest] Advancing last_sync_at despite ${result.remaining} remaining — this run stored no new emails, so holding would wedge`
      );
    }
    await admin
      .from("user_tokens")
      .update({ last_sync_at: syncStartedAt })
      .eq("user_id", userId);
  } else {
    console.log(
      `[ingest] Holding last_sync_at — ${result.remaining} emails still to process in this window`
    );
  }

  // Record OpenAI usage for this run
  if (emailsScanned > 0) {
    await trackUsage({
      action: "email_parse",
      user_id: userId,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      emails_retrieved: result.fetched,
      emails_scanned: emailsScanned,
    }, admin);
  }

  console.log(`[ingest] Pipeline complete. Fetched: ${result.fetched}, New: ${result.newEmails}, Parsed: ${result.parsed}, New apps: ${result.newApplications}, Remaining: ${result.remaining}, Errors: ${result.errors.length}`);
  return result;
}
