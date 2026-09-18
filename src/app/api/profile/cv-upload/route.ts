import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractTextFromPdf } from "@/lib/profile/extract-pdf";
import { generateProfileFromCvText } from "@/lib/profile/generate-profile";
import { getCandidateProfile, upsertCandidateProfile } from "@/lib/db/candidate-profile";
import { mergeProfileData } from "@/lib/profile/merge-profile";
import { DEFAULT_PROFILE_DATA } from "@/lib/profile/defaults";
import { trackUsage } from "@/lib/db/user-usage";
import { isDemoUser } from "@/utils/demo";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// A valid PDF begins with the "%PDF-" header. The spec allows a small amount of
// leading bytes before it, so we scan the start of the file rather than only
// byte 0. This rejects files that merely claim a PDF mime type / extension.
function hasPdfMagicBytes(buffer: Buffer): boolean {
  const header = buffer.subarray(0, 1024).toString("latin1");
  return header.includes("%PDF-");
}

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
        { error: "CV upload is disabled for demo accounts" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("cv");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CV file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "PDF must be between 1 byte and 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasPdfMagicBytes(buffer)) {
      return NextResponse.json(
        { error: "File is not a valid PDF" },
        { status: 400 },
      );
    }

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

    await trackUsage({
      action: "cv_to_profile",
      user_id: user.id,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
    });

    // A CV never mentions everything a profile holds, so the extraction is
    // folded into what is already saved rather than replacing it. Without this,
    // re-uploading wipes anything the user filled in by hand.
    const existing = await getCandidateProfile(user.id);
    const { merged, changed } = mergeProfileData(
      existing?.profile_data ?? DEFAULT_PROFILE_DATA,
      generated.profile_data,
    );

    const { data, error } = await upsertCandidateProfile(user.id, {
      cv_markdown: generated.cv_markdown,
      profile_data: merged,
      cv_filename: file.name,
      cv_mime_type: file.type,
      cv_uploaded_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data, changed_fields: changed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected CV upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
