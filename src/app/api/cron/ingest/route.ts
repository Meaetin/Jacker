import { NextRequest, NextResponse } from "next/server";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Without this guard an unset secret interpolates to the literal string
  // "Bearer undefined", which any caller could send. Fail closed instead.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connected, error } = await createAdminClient()
    .from("user_tokens")
    .select("user_id");

  if (error) {
    console.error(`[cron] Could not list connected users: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!connected?.length) {
    console.log("[cron] No users have connected Gmail — nothing to do");
    return NextResponse.json({ users: 0, runs: [] });
  }

  console.log(`[cron] Ingesting for ${connected.length} connected user(s)`);

  // Sequential on purpose: each run makes a long series of Gmail and OpenAI
  // calls, and firing them all at once would hit rate limits on both.
  const runs: Record<string, unknown>[] = [];
  for (const { user_id } of connected) {
    try {
      const result = await runIngestPipeline(user_id);
      runs.push({ userId: user_id, ...result });
    } catch (caught) {
      // One user's failure must not cost everyone else their sync.
      const message = caught instanceof Error ? caught.message : "Unknown error";
      console.error(`[cron] Ingest failed for user ${user_id}: ${message}`);
      runs.push({ userId: user_id, error: message });
    }
  }

  return NextResponse.json({ users: connected.length, runs });
}
