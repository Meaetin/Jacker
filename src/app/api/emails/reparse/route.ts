import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { runReparsePipeline } from "@/lib/ingest/reparse-pipeline";

// Re-parsing a backlog is one AI call per stored email. Without this the route
// runs on the platform default, which is far shorter than the sync route's
// budget for the same kind of work.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[reparse] Reparse requested by user ${user.id}`);
  const startTime = Date.now();

  const result = await runReparsePipeline(user.id);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[reparse] Reparse completed in ${elapsed}s`);

  return NextResponse.json({ ...result, duration: `${elapsed}s` });
}
