import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { runIngestPipeline } from "@/lib/ingest/pipeline";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tokens } = await supabase
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

  const result = await runIngestPipeline(user.id, fromDate);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[sync] Sync completed in ${elapsed}s`);

  return NextResponse.json({ ...result, duration: `${elapsed}s` });
}
