import { createClient } from "@/utils/supabase/server";
import type { CandidateProfileData, CandidateProfileRecord } from "@/types/profile";
import { DEFAULT_PROFILE_DATA } from "@/lib/profile/defaults";
import { candidateProfileDataSchema } from "@/types/schemas";

export async function getCandidateProfile(userId: string): Promise<CandidateProfileRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const normalized = candidateProfileDataSchema.safeParse(data.profile_data);

  return {
    ...(data as CandidateProfileRecord),
    profile_data: normalized.success ? normalized.data : DEFAULT_PROFILE_DATA,
  };
}

export async function upsertCandidateProfile(
  userId: string,
  fields: {
    cv_markdown?: string;
    profile_data?: CandidateProfileData;
    cv_filename?: string | null;
    cv_mime_type?: string | null;
    cv_uploaded_at?: string | null;
  },
) {
  const supabase = await createClient();

  return supabase
    .from("candidate_profiles")
    .upsert(
      {
        user_id: userId,
        profile_data: fields.profile_data ?? DEFAULT_PROFILE_DATA,
        cv_markdown: fields.cv_markdown ?? null,
        cv_filename: fields.cv_filename ?? null,
        cv_mime_type: fields.cv_mime_type ?? null,
        cv_uploaded_at: fields.cv_uploaded_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
}

export async function updateCandidateProfile(
  userId: string,
  fields: Partial<{
    cv_markdown: string;
    profile_data: CandidateProfileData;
  }>,
) {
  const supabase = await createClient();

  return supabase
    .from("candidate_profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
}
