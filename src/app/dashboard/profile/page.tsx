import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { ProfileWorkspace } from "@/components/profile-workspace";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getCandidateProfile(user.id) : null;

  return <ProfileWorkspace initialProfile={profile} />;
}
