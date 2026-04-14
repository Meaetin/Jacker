import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { runIngestPipeline } from "@/lib/ingest/pipeline";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.email === process.env.DEMO_USER_EMAIL) {
    return NextResponse.json(
      { error: "Ingestion is disabled for demo accounts" },
      { status: 403 }
    );
  }

  const result = await runIngestPipeline(user.id);
  return NextResponse.json(result);
}
