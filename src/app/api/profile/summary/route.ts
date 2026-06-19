import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateProfileSummary } from "@/lib/profile/generate-summary";
import { normalizeProfileData } from "@/lib/profile/defaults";
import { trackUsage } from "@/lib/db/user-usage";
import { isDemoUser } from "@/utils/demo";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUser(user.email)) {
      return NextResponse.json(
        { error: "Summary generation is disabled for demo accounts" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const profileData = normalizeProfileData(body?.profile_data);
    const cvMarkdown = typeof body?.cv_markdown === "string" ? body.cv_markdown : "";

    if (!cvMarkdown.trim()) {
      return NextResponse.json(
        { error: "Add your CV markdown before generating a summary" },
        { status: 400 },
      );
    }

    let generated;
    try {
      generated = await generateProfileSummary(profileData, cvMarkdown);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Summary generation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await trackUsage({
      action: "cv_to_profile",
      user_id: user.id,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
    });

    return NextResponse.json({ ai_summary: generated.ai_summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected summary error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
