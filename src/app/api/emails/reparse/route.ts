import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { runReparsePipeline } from "@/lib/ingest/reparse-pipeline";

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
