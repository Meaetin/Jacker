import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { getJobFitAnalyses } from "@/lib/db/job-fit-analyses";
import { JobAnalysisWorkspace } from "@/components/job-analysis-workspace";

export default async function JobAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, analyses] = user
    ? await Promise.all([
        getCandidateProfile(user.id),
        getJobFitAnalyses(user.id, 30),
      ])
    : [null, []];

  return <JobAnalysisWorkspace profileReady={Boolean(profile?.cv_markdown)} initialAnalyses={analyses} />;
}
