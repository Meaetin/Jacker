"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ThumbsUp, AlertTriangle, Lightbulb, MessageSquare, Sparkles } from "lucide-react";
import { ScoreRing } from "./score-ring";
import { ThemedSection } from "./themed-section";
import { AnalysisLoading } from "./analysis-loading";
import { DocumentGenerateDialog } from "@/components/document-generate-dialog";
import type { JobFitAnalysis } from "@/types/profile";

interface ResultDetailProps {
  analysis: JobFitAnalysis | null;
  loading: boolean;
}

const SECTION_CONFIG = [
  { icon: ThumbsUp, title: "Strengths", accent: "#6b9f6b", bg: "#edf5ed", titleColor: "#5a8a5a" },
  { icon: AlertTriangle, title: "Gaps", accent: "#c47070", bg: "#f8eded", titleColor: "#b06060" },
  { icon: Lightbulb, title: "Recommendations", accent: "#d49b3a", bg: "#faf3e5", titleColor: "#c08a2a" },
  { icon: MessageSquare, title: "Overall", accent: "#5b8fb9", bg: "#edf4f9", titleColor: "#4a7fa0" },
];

const SECTION_BODY_KEYS: Record<string, keyof JobFitAnalysis> = {
  Strengths: "strengths_md",
  Gaps: "gaps_md",
  Recommendations: "recommendations_md",
  Overall: "overall_feedback_md",
};

export function ResultDetail({ analysis, loading }: ResultDetailProps) {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="result-detail card">
        <AnalysisLoading />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="result-detail-empty card flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-secondary">
          Select an analysis from history or run a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="result-detail card space-y-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={analysis.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="result-detail-content space-y-5"
        >
          {/* Score hero */}
          <div className="result-detail-hero flex flex-col items-center pt-2 pb-4">
            <ScoreRing score={analysis.score} band={analysis.band} size="lg" />
          </div>

          {/* Metadata */}
          <div className="result-detail-meta flex flex-col items-center gap-1">
            {(analysis.job_title || analysis.company_name) && (
              <p className="result-detail-job text-sm font-medium text-text-primary">
                {[analysis.job_title, analysis.company_name].filter(Boolean).join(" @ ")}
              </p>
            )}
            {analysis.source_url && (
              <a
                href={analysis.source_url}
                target="_blank"
                rel="noreferrer"
                className="result-detail-url text-xs text-brand hover:underline"
              >
                {analysis.source_url}
              </a>
            )}
          </div>

          {/* Generate CTA */}
          <div className="result-detail-generate rounded-lg border border-border bg-brand-light/50 p-4 flex items-center justify-between gap-4">
            <div className="generate-info">
              <p className="generate-info-title text-sm font-medium text-text-primary">
                Generate a document
              </p>
              <p className="generate-info-desc text-xs text-text-secondary">
                Create a cover letter or application email from this analysis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGenerateDialogOpen(true)}
              className="generate-button btn-primary inline-flex items-center gap-2 flex-shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </button>
          </div>

          {/* Themed sections */}
          <div className="result-detail-sections space-y-3">
            {SECTION_CONFIG.map((cfg, index) => (
              <motion.div
                key={cfg.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ThemedSection
                  icon={cfg.icon}
                  title={cfg.title}
                  body={analysis[SECTION_BODY_KEYS[cfg.title]] as string}
                  accent={cfg.accent}
                  bg={cfg.bg}
                  titleColor={cfg.titleColor}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <DocumentGenerateDialog
        analysis={analysis}
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
      />
    </div>
  );
}
