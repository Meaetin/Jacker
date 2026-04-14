import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { analyzeJobFit } from "@/lib/profile/analyze-job-fit";
import { getScoreBand } from "@/lib/profile/defaults";
import { getJobFitAnalyses, insertJobFitAnalysis } from "@/lib/db/job-fit-analyses";
import { jobAnalysisRequestSchema } from "@/types/schemas";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyses = await getJobFitAnalyses(user.id, 30);
  return NextResponse.json({ analyses });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = jobAnalysisRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const profile = await getCandidateProfile(user.id);
  if (!profile || !profile.cv_markdown) {
    return NextResponse.json(
      { error: "Create your CV and profile first" },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await analyzeJobFit({
      cvMarkdown: profile.cv_markdown,
      profileData: profile.profile_data,
      jobDescription: parsed.data.job_description,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const band = getScoreBand(result.score);

  const { data, error } = await insertJobFitAnalysis({
    user_id: user.id,
    job_description: parsed.data.job_description,
    score: result.score,
    band,
    strengths_md: result.strengths_md,
    gaps_md: result.gaps_md,
    recommendations_md: result.recommendations_md,
    overall_feedback_md: result.overall_feedback_md,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ analysis: data });
}
