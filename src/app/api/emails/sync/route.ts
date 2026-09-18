import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import { isDemoUser } from "@/utils/demo";

// A 200-email sync (each an AI parse call) can run well past the default
// serverless timeout. The job row + Realtime decouple the UI from the request,
// but the pipeline itself still needs room to finish.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Email sync is disabled for demo accounts" },
      { status: 403 },
    );
  }

  const { data: tokens } = await createAdminClient()
    .from("user_tokens")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokens) {
    return NextResponse.json(
      { error: "Gmail not connected" },
      { status: 400 }
    );
  }

  // Parse optional fromDate from request body
  let fromDate: Date | undefined;
  try {
    const body = await request.json();
    if (body.fromDate) {
      fromDate = new Date(body.fromDate);
      if (isNaN(fromDate.getTime())) {
        fromDate = undefined;
      }
    }
  } catch {
    // No body or invalid JSON — use default behavior
  }

  console.log(`[sync] Sync requested by user ${user.id}${fromDate ? ` from ${fromDate.toISOString()}` : ""}`);
  const startTime = Date.now();

  // Persist a sync job so the UI can show live progress and survive refreshes.
  // Admin client keeps these writes reliable across the long-running request.
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("sync_jobs")
    .insert({ user_id: user.id, status: "running" })
    .select("id")
    .single();
  const jobId = job?.id as string | undefined;

  // The pipeline reports after every email, and with 8 parses in flight that is a
  // lot of writes for a progress bar. Throttle to one every couple of seconds; the
  // completion update below writes the authoritative final numbers either way.
  const PROGRESS_WRITE_INTERVAL_MS = 2000;
  let lastProgressWrite = 0;

  try {
    const result = await runIngestPipeline(user.id, {
      fromDate,
      onProgress: async (progress) => {
        if (!jobId) return;

        const now = Date.now();
        if (now - lastProgressWrite < PROGRESS_WRITE_INTERVAL_MS) return;
        lastProgressWrite = now;

        await admin
          .from("sync_jobs")
          .update({
            total: progress.total,
            processed: progress.processed,
            new_applications: progress.newApplications,
            updated_applications: progress.updatedApplications,
          })
          .eq("id", jobId);
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[sync] Sync completed in ${elapsed}s`);

    if (jobId) {
      await admin
        .from("sync_jobs")
        .update({
          status: "done",
          processed: result.fetched,
          total: result.fetched,
          new_applications: result.newApplications,
          updated_applications: result.updatedApplications,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return NextResponse.json({ ...result, jobId, duration: `${elapsed}s` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Sync failed";
    console.error(`[sync] Sync failed: ${msg}`);
    if (jobId) {
      await admin
        .from("sync_jobs")
        .update({ status: "error", error: msg, finished_at: new Date().toISOString() })
        .eq("id", jobId);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
