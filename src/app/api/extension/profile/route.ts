import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { toAutofillProfile } from "@/lib/profile/autofill-profile";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCandidateProfile(user.id);

  if (!profile) {
    return NextResponse.json(
      { error: "No candidate profile yet. Upload a CV in Job Tracker first." },
      { status: 404 },
    );
  }

  try {
    return NextResponse.json({
      profile: toAutofillProfile(profile.profile_data, {
        filename: profile.cv_filename,
        markdown: profile.cv_markdown,
      }),
      updated_at: profile.updated_at,
    });
  } catch (error) {
    // A bare 500 reaches the extension as "Job Tracker returned 500", which
    // says nothing about which profile field was malformed.
    console.error("[extension/profile] Failed to build autofill profile:", error);
    return NextResponse.json(
      { error: `Could not read your profile: ${error instanceof Error ? error.message : "unknown error"}` },
      { status: 500 },
    );
  }
}
