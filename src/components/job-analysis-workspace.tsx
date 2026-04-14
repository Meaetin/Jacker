"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JobFitAnalysis } from "@/types/profile";

interface JobAnalysisWorkspaceProps {
  initialAnalyses: JobFitAnalysis[];
  profileReady: boolean;
}

function bandLabel(band: JobFitAnalysis["band"]) {
  if (band === "strong_fit") return "Strong Fit";
  if (band === "moderate_fit") return "Moderate Fit";
  return "Weak Fit";
}

function bandClasses(band: JobFitAnalysis["band"]) {
  if (band === "strong_fit") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (band === "moderate_fit") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function MarkdownBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans">{body}</pre>
    </div>
  );
}

export function JobAnalysisWorkspace({ initialAnalyses, profileReady }: JobAnalysisWorkspaceProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<JobFitAnalysis[]>(initialAnalyses);

  const latest = analyses[0] ?? null;

  async function runAnalysis() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/job-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setAnalyses((prev) => [data.analysis, ...prev]);
    } catch {
      setError("Analysis failed due to a network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Job Analysis</h1>
        <p className="text-sm text-text-secondary">
          Paste a job description to evaluate how well your CV and profile match.
        </p>

        {!profileReady && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Set up your CV and profile first on the CV & Profile page.
          </div>
        )}

        <Textarea
          id="job_description"
          label="Job Description"
          rows={12}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste full job description here..."
        />

        <Button onClick={runAnalysis} disabled={loading || !profileReady || jobDescription.trim().length < 50}>
          {loading ? "Analyzing..." : "Analyze Fit"}
        </Button>

        {error && <p className="text-sm text-status-rejected">{error}</p>}
      </div>

      {latest && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text-primary">Latest Result</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${bandClasses(latest.band)}`}>
              {latest.score}/100 - {bandLabel(latest.band)}
            </span>
          </div>

          <MarkdownBlock title="Good Parts" body={latest.strengths_md} />
          <MarkdownBlock title="Bad Parts" body={latest.gaps_md} />
          <MarkdownBlock title="Feedback" body={latest.recommendations_md} />
          <MarkdownBlock title="Overall" body={latest.overall_feedback_md} />
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">History</h2>
        {analyses.length === 0 ? (
          <p className="text-sm text-text-secondary">No analyses yet.</p>
        ) : (
          analyses.map((analysis) => (
            <div key={analysis.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${bandClasses(analysis.band)}`}>
                  {analysis.score}/100 - {bandLabel(analysis.band)}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(analysis.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{analysis.job_description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
