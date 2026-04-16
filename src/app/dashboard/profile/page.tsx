import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { ProfileWorkspace } from "@/components/profile-workspace";
import { isDemoUser } from "@/utils/demo";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getCandidateProfile(user.id) : null;
  const demo = isDemoUser(user?.email);

  return <ProfileWorkspace initialProfile={profile} isDemo={demo} />;
}
