import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCandidateProfile } from "@/lib/db/candidate-profile";
import { generateDocument } from "@/lib/profile/generate-document";
import { trackUsage } from "@/lib/db/user-usage";
import { documentGenerationRequestSchema } from "@/types/schemas";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = documentGenerationRequestSchema.safeParse(body);

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

  const { data: analysis, error: analysisError } = await supabase
    .from("job_fit_analyses")
    .select("*")
    .eq("id", parsed.data.analysis_id)
    .eq("user_id", user.id)
    .single();

  if (analysisError || !analysis) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 },
    );
  }

  let result;
  try {
    result = await generateDocument({
      documentType: parsed.data.document_type,
      cvMarkdown: profile.cv_markdown,
      profileData: profile.profile_data,
      jobDescription: analysis.job_description,
      analysisResult: {
        score: analysis.score,
        band: analysis.band,
        strengths_md: analysis.strengths_md,
        gaps_md: analysis.gaps_md,
        recommendations_md: analysis.recommendations_md,
        overall_feedback_md: analysis.overall_feedback_md,
      },
      customInstructions: parsed.data.custom_instructions,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await trackUsage({
    action: "document_generation",
    user_id: user.id,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
  });

  return NextResponse.json({
    content_md: result.content_md,
    document_type: parsed.data.document_type,
  });
}
