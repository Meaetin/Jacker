import { createClient } from "@/utils/supabase/server";
import type { FitBand, JobFitAnalysis } from "@/types/profile";

interface InsertAnalysisInput {
  user_id: string;
  job_description: string;
  company_name: string | null;
  job_title: string | null;
  source_url: string | null;
  score: number;
  band: FitBand;
  matches_md: string;
  gaps_md: string;
  recommendations_md: string;
  overall_feedback_md: string;
}

export async function insertJobFitAnalysis(entry: InsertAnalysisInput) {
  const supabase = await createClient();
  return supabase.from("job_fit_analyses").insert(entry).select().single();
}

export async function getJobFitAnalyses(
  userId: string,
  { page = 1, limit = 9 }: { page?: number; limit?: number } = {},
): Promise<{ analyses: JobFitAnalysis[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from("job_fit_analyses")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error || !data) return { analyses: [], total: 0 };
  return { analyses: data as JobFitAnalysis[], total: count ?? 0 };
}
