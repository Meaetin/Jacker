import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile, updateCandidateProfile, upsertCandidateProfile } from "@/lib/db/candidate-profile";
import { candidateProfileUpdateSchema } from "@/types/schemas";
import { isDemoUser } from "@/utils/demo";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCandidateProfile(user.id);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Profile editing is disabled for demo accounts" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = candidateProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getCandidateProfile(user.id);

  if (!existing) {
    const { data, error } = await upsertCandidateProfile(user.id, {
      cv_markdown: parsed.data.cv_markdown,
      profile_data: parsed.data.profile_data,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  }

  const { data, error } = await updateCandidateProfile(user.id, parsed.data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
