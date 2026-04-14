import { createClient } from "@/utils/supabase/server";
import type { FitBand, JobFitAnalysis } from "@/types/profile";

interface InsertAnalysisInput {
  user_id: string;
  job_description: string;
  score: number;
  band: FitBand;
  strengths_md: string;
  gaps_md: string;
  recommendations_md: string;
  overall_feedback_md: string;
}

export async function insertJobFitAnalysis(entry: InsertAnalysisInput) {
  const supabase = await createClient();
  return supabase.from("job_fit_analyses").insert(entry).select().single();
}

export async function getJobFitAnalyses(userId: string, limit = 20): Promise<JobFitAnalysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_fit_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as JobFitAnalysis[];
}
