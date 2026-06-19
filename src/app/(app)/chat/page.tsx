import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { getJobFitAnalyses } from "@/lib/db/job-fit-analyses";
import { ChatWorkspace } from "@/components/chat/workspace";
import { isDemoUser } from "@/utils/demo";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demo = isDemoUser(user?.email);

  const [profile, history] = user
    ? await Promise.all([
        getCandidateProfile(user.id),
        getJobFitAnalyses(user.id, { page: 1, limit: 30 }),
      ])
    : [null, { analyses: [], total: 0 }];

  return (
    <ChatWorkspace
      profileReady={Boolean(profile?.cv_markdown)}
      analyses={history.analyses}
      isDemo={demo}
    />
  );
}
