import { NextRequest, NextResponse } from "next/server";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the primary (non-demo) user
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("user_tokens")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  if (!tokens) {
    return NextResponse.json(
      { error: "No user with Gmail tokens found" },
      { status: 200 }
    );
  }

  const result = await runIngestPipeline(tokens.user_id);
  return NextResponse.json(result);
}
