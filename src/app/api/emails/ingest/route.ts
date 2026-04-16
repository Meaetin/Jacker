import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { runIngestPipeline } from "@/lib/ingest/pipeline";
import { isDemoUser } from "@/utils/demo";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Ingestion is disabled for demo accounts" },
      { status: 403 }
    );
  }

  const result = await runIngestPipeline(user.id);
  return NextResponse.json(result);
}
