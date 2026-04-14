import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractTextFromPdf } from "@/lib/profile/extract-pdf";
import { generateProfileFromCvText } from "@/lib/profile/generate-profile";
import { upsertCandidateProfile } from "@/lib/db/candidate-profile";
import { insertUserUsage } from "@/lib/db/user-usage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("cv");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CV file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "PDF must be between 1 byte and 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let cvText = "";
    try {
      cvText = await extractTextFromPdf(buffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read text from PDF";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!cvText) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    let generated;
    try {
      generated = await generateProfileFromCvText(cvText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profile generation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await insertUserUsage({
      user_id: user.id,
      action_type: "cv_to_profile",
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
    });

    const { data, error } = await upsertCandidateProfile(user.id, {
      cv_markdown: generated.cv_markdown,
      profile_data: generated.profile_data,
      cv_filename: file.name,
      cv_mime_type: file.type,
      cv_uploaded_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected CV upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
