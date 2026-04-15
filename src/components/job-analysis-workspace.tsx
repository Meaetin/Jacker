"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JobFitAnalysis } from "@/types/profile";

interface JobAnalysisWorkspaceProps {
  initialAnalyses: JobFitAnalysis[];
  profileReady: boolean;
}

type InputMode = "paste" | "url";

function bandLabel(band: JobFitAnalysis["band"]) {
  if (band === "strong_fit") return "Strong Fit";
  if (band === "moderate_fit") return "Moderate Fit";
  return "Weak Fit";
}

function bandClasses(band: JobFitAnalysis["band"]) {
  if (band === "strong_fit") return "bg-[#edf5ed] text-[#6b9f6b] border-[#c5dfc5]";
  if (band === "moderate_fit") return "bg-[#faf3e5] text-[#d49b3a] border-[#e8d5a8]";
  return "bg-[#f8eded] text-[#c47070] border-[#e0c0c0]";
}

function MarkdownBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans">{body}</pre>
    </div>
  );
}

function HistoryItem({ analysis }: { analysis: JobFitAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((prev) => !prev)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((prev) => !prev); }}
      className="analysis-history-item cursor-pointer rounded-lg border border-border p-3 transition-colors hover:bg-brand-light"
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${bandClasses(analysis.band)}`}>
          {analysis.score}/100 - {bandLabel(analysis.band)}
        </span>
        <span className="text-xs text-text-muted" suppressHydrationWarning>
          {new Date(analysis.created_at).toLocaleString()}
        </span>
      </div>
      {(analysis.job_title || analysis.company_name) && (
        <p className="mt-2 text-sm font-medium text-text-primary">
          {[analysis.job_title, analysis.company_name].filter(Boolean).join(" @ ")}
        </p>
      )}
      {analysis.source_url && (
        <span className="mt-1 inline-block text-xs text-brand hover:underline">
          {analysis.source_url}
        </span>
      )}
      <div className={expanded ? "" : "line-clamp-3"}>
        <MarkdownBlock title="Good Parts" body={analysis.strengths_md} />
        <MarkdownBlock title="Bad Parts" body={analysis.gaps_md} />
        <MarkdownBlock title="Recommendations" body={analysis.recommendations_md} />
        <MarkdownBlock title="Overall" body={analysis.overall_feedback_md} />
      </div>
      <span className="mt-2 inline-block text-xs text-brand">
        {expanded ? "Show less" : "Show more"}
      </span>
    </div>
  );
}

export function JobAnalysisWorkspace({ initialAnalyses, profileReady }: JobAnalysisWorkspaceProps) {
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<JobFitAnalysis[]>(initialAnalyses);

  const latest = analyses[0] ?? null;

  // Listen for prefill events dispatched by the Chrome extension
  useEffect(() => {
    function handlePrefill(e: Event) {
      const { text, url } = (e as CustomEvent<{ text: string; url: string }>).detail;
      setJobDescription(text.slice(0, 60000));
      setJobUrl(url);
      setInputMode("paste");
      setError(null);
    }
    window.addEventListener("job-tracker:prefill", handlePrefill);
    return () => window.removeEventListener("job-tracker:prefill", handlePrefill);
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(inputMode === "paste"
            ? { job_description: jobDescription }
            : { source_url: jobUrl }),
          company_name: companyName || undefined,
          job_title: jobTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }
      setAnalyses((prev) => [data.analysis, ...prev]);
      setJobDescription("");
      setJobUrl("");
    } catch {
      setError("Analysis failed due to a network error.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    profileReady &&
    !loading &&
    (inputMode === "paste"
      ? jobDescription.trim().length >= 50
      : jobUrl.trim().length > 0);

  return (
    <div className="job-analysis-page space-y-6">
      <div className="job-input-section card space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Job Analysis</h1>
        <p className="text-sm text-text-secondary">
          Paste a job description or provide a URL. Use the Job Tracker Chrome extension to extract from any page.
        </p>

        {!profileReady && (
          <div className="profile-warning-banner rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Set up your CV and profile first on the CV & Profile page.
          </div>
        )}

        <div className="mode-tabs flex flex-wrap gap-2">
          <Button
            type="button"
            variant={inputMode === "paste" ? "primary" : "secondary"}
            onClick={() => { setInputMode("paste"); setError(null); }}
          >
            Paste JD
          </Button>
          <Button
            type="button"
            variant={inputMode === "url" ? "primary" : "secondary"}
            onClick={() => { setInputMode("url"); setError(null); }}
          >
            Use URL
          </Button>
        </div>

        {inputMode === "paste" && (
          <Textarea
            id="job_description"
            label="Job Description"
            rows={12}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste full job description here..."
            disabled={loading}
          />
        )}

        {inputMode === "url" && (
          <Input
            id="job_url"
            type="url"
            label="Job Posting URL"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://company.com/careers/job-id"
            disabled={loading}
          />
        )}

        <div className="metadata-fields grid gap-3 md:grid-cols-2">
          <Input
            id="company_name"
            label="Company Name (optional)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Stripe"
          />
          <Input
            id="job_title"
            label="Job Title (optional)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Software Engineer"
          />
        </div>

        <Button onClick={runAnalysis} disabled={!canSubmit}>
          {loading ? (inputMode === "url" ? "Scraping and analyzing..." : "Analyzing...") : "Analyze Fit"}
        </Button>

        {error && <p className="text-sm text-status-rejected">{error}</p>}
      </div>

      {(loading || latest) && (
        <div className="analysis-result-section card space-y-4">
          {loading ? (
            <>
              <div className="result-header flex items-center justify-between gap-3">
                <div className="skeleton-title h-6 w-36 animate-pulse rounded bg-surface-raised" />
                <div className="skeleton-badge h-6 w-24 animate-pulse rounded-full bg-surface-raised" />
              </div>
              <div className="skeleton-lines space-y-3">
                <div className="skeleton-line h-4 w-full animate-pulse rounded bg-surface-raised" />
                <div className="skeleton-line h-4 w-5/6 animate-pulse rounded bg-surface-raised" />
                <div className="skeleton-line h-4 w-4/6 animate-pulse rounded bg-surface-raised" />
              </div>
              <div className="skeleton-blocks space-y-2">
                {["Good Parts", "Bad Parts", "Feedback", "Overall"].map((title) => (
                  <div key={title} className="space-y-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
                    <div className="h-16 w-full animate-pulse rounded bg-surface-overlay" />
                  </div>
                ))}
              </div>
            </>
          ) : latest && (
            <>
              <div className="result-header flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Latest Result</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${bandClasses(latest.band)}`}>
                  {latest.score}/100 - {bandLabel(latest.band)}
                </span>
              </div>
              {(latest.job_title || latest.company_name) && (
                <p className="text-sm text-text-secondary">
                  {[latest.job_title, latest.company_name].filter(Boolean).join(" @ ")}
                </p>
              )}
              {latest.source_url && (
                <a
                  href={latest.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-brand hover:underline"
                >
                  {latest.source_url}
                </a>
              )}

              <MarkdownBlock title="Good Parts" body={latest.strengths_md} />
              <MarkdownBlock title="Bad Parts" body={latest.gaps_md} />
              <MarkdownBlock title="Feedback" body={latest.recommendations_md} />
              <MarkdownBlock title="Overall" body={latest.overall_feedback_md} />
            </>
          )}
        </div>
      )}

      <div className="analysis-history-section card space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">History</h2>
        {analyses.length === 0 ? (
          <p className="text-sm text-text-secondary">No analyses yet.</p>
        ) : (
          <div className="analysis-history-list space-y-2">
            {analyses.map((analysis) => (
              <HistoryItem key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
