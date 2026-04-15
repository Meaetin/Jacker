import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { analyzeJobFit } from "@/lib/profile/analyze-job-fit";
import { getScoreBand } from "@/lib/profile/defaults";
import { getJobFitAnalyses, insertJobFitAnalysis } from "@/lib/db/job-fit-analyses";
import { scrapeJobPosting } from "@/lib/profile/scrape-job-posting";
import { extractJobDescription } from "@/lib/profile/extract-job-description";
import { trackUsage } from "@/lib/db/user-usage";
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

  const normalizeOptional = (value?: string | null) => {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  };

  let jobDescription = normalizeOptional(parsed.data.job_description);
  let sourceUrl = normalizeOptional(parsed.data.source_url);
  let companyName = normalizeOptional(parsed.data.company_name);
  let jobTitle = normalizeOptional(parsed.data.job_title);

  if (sourceUrl && !jobDescription) {
    try {
      const scraped = await scrapeJobPosting(sourceUrl);
      jobDescription = scraped.jobDescription;
      sourceUrl = scraped.sourceUrl;
      companyName = companyName ?? scraped.companyName;
      jobTitle = jobTitle ?? scraped.jobTitle;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to scrape job URL";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!jobDescription || jobDescription.length < 50) {
    return NextResponse.json(
      { error: "Job description must be at least 50 characters" },
      { status: 400 },
    );
  }

  // Clean extraction step — best-effort, falls back to raw text
  try {
    const extracted = await extractJobDescription(jobDescription);
    if (extracted.cleanedText.length >= 50) {
      jobDescription = extracted.cleanedText;
      companyName = companyName ?? extracted.companyName;
      jobTitle = jobTitle ?? extracted.jobTitle;
    }
    await trackUsage({
      action: "job_extraction",
      user_id: user.id,
      input_tokens: extracted.inputTokens,
      output_tokens: extracted.outputTokens,
    });
  } catch {
    // Extraction failed — proceed with raw text
  }

  let result;
  try {
    result = await analyzeJobFit({
      cvMarkdown: profile.cv_markdown,
      profileData: profile.profile_data,
      jobDescription,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await trackUsage({
    action: "job_analysis",
    user_id: user.id,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
  });

  companyName = companyName ?? result.company_name;
  jobTitle = jobTitle ?? result.job_title;

  const band = getScoreBand(result.score);

  const { data, error } = await insertJobFitAnalysis({
    user_id: user.id,
    job_description: jobDescription,
    company_name: companyName,
    job_title: jobTitle,
    source_url: sourceUrl,
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
