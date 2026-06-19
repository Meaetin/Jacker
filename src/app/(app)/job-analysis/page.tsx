import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { getJobFitAnalyses } from "@/lib/db/job-fit-analyses";
import { JobAnalysisWorkspace } from "@/components/job-analysis/workspace";

export default async function JobAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, history] = user
    ? await Promise.all([
        getCandidateProfile(user.id),
        getJobFitAnalyses(user.id, { page: 1, limit: 9 }),
      ])
    : [null, { analyses: [], total: 0 }];

  return (
    <JobAnalysisWorkspace
      profileReady={Boolean(profile?.cv_markdown)}
      initialAnalyses={history.analyses}
      initialTotal={history.total}
    />
  );
}
