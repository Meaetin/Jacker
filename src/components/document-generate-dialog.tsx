"use client";

import { useState } from "react";
import { FileText, Mail, Copy, Check, Sparkles, ArrowLeft, Download, Pencil, PencilLine } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadAsDoc, downloadAsPdf } from "@/lib/profile/download-document";
import type { DocumentType, JobFitAnalysis } from "@/types/profile";

type DialogStep = "select_type" | "generating" | "result";

const DOCUMENT_OPTIONS: {
  type: DocumentType;
  icon: typeof FileText;
  label: string;
  description: string;
}[] = [
  {
    type: "cover_letter",
    icon: FileText,
    label: "Cover Letter",
    description: "Personalized cover letter highlighting your fit",
  },
  {
    type: "application_email",
    icon: Mail,
    label: "Application Email",
    description: "Concise outreach email with subject line",
  },
];

interface DocumentGenerateDialogProps {
  analysis: JobFitAnalysis;
  open: boolean;
  onClose: () => void;
}

export function DocumentGenerateDialog({
  analysis,
  open,
  onClose,
}: DocumentGenerateDialogProps) {
  const [step, setStep] = useState<DialogStep>("select_type");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);

  function resetAndClose() {
    setStep("select_type");
    setSelectedType(null);
    setCustomInstructions("");
    setContent(null);
    setError(null);
    setCopied(false);
    setEditing(false);
    onClose();
  }

  async function handleGenerate() {
    if (!selectedType) return;

    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysis.id,
          document_type: selectedType,
          custom_instructions: customInstructions || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        setStep("select_type");
        return;
      }

      setContent(data.content_md);
      setStep("result");
    } catch {
      setError("Network error. Please try again.");
      setStep("select_type");
    }
  }

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPdf() {
    if (!content || !selectedType) return;
    setDownloading(true);
    try {
      await downloadAsPdf(content, analysis, selectedType);
    } finally {
      setDownloading(false);
    }
  }

  function handleDownloadDoc() {
    if (!content || !selectedType) return;
    downloadAsDoc(content, analysis, selectedType);
  }

  const jobLabel = [analysis.job_title, analysis.company_name]
    .filter(Boolean)
    .join(" @ ");

  return (
    <Dialog open={open} onClose={resetAndClose}>
      <div className="document-generate-dialog space-y-4">
        <h2 className="text-lg font-semibold text-text-primary font-display">
          Generate Document
        </h2>

        {jobLabel && (
          <p className="text-sm text-text-secondary">{jobLabel}</p>
        )}

        {step === "select_type" && (
          <div className="type-selection space-y-4">
            <div className="type-options grid grid-cols-2 gap-3">
              {DOCUMENT_OPTIONS.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`type-option card-raised flex flex-col items-center gap-2 p-4 text-center transition-all ${
                    selectedType === type
                      ? "border-brand bg-brand-light"
                      : "hover:border-brand"
                  }`}
                >
                  <Icon className="type-option-icon h-6 w-6 text-brand" />
                  <span className="type-option-label text-sm font-medium text-text-primary">
                    {label}
                  </span>
                  <span className="type-option-desc text-xs text-text-secondary">
                    {description}
                  </span>
                </button>
              ))}
            </div>

            <Textarea
              id="custom_instructions"
              label="Custom instructions (optional)"
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Keep it under 200 words, emphasize leadership experience..."
            />

            {error && (
              <p className="generation-error text-sm text-status-rejected">{error}</p>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!selectedType}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate {selectedType === "cover_letter" ? "Cover Letter" : selectedType === "application_email" ? "Email" : "Document"}
            </Button>
          </div>
        )}

        {step === "generating" && (
          <div className="generation-loading space-y-3">
            <div className="skeleton-title h-6 w-48 animate-pulse rounded bg-surface-raised" />
            <div className="skeleton-lines space-y-2">
              <div className="skeleton-line h-4 w-full animate-pulse rounded bg-surface-raised" />
              <div className="skeleton-line h-4 w-5/6 animate-pulse rounded bg-surface-raised" />
              <div className="skeleton-line h-4 w-4/6 animate-pulse rounded bg-surface-raised" />
              <div className="skeleton-line h-4 w-full animate-pulse rounded bg-surface-raised" />
              <div className="skeleton-line h-4 w-3/4 animate-pulse rounded bg-surface-raised" />
            </div>
          </div>
        )}

        {step === "result" && content && (
          <div className="generation-result space-y-4">
            <div className="result-actions flex items-center justify-between">
              <span className="result-type-badge badge bg-brand-light text-brand">
                {selectedType === "cover_letter" ? "Cover Letter" : "Application Email"}
              </span>
              <div className="result-action-buttons flex items-center gap-2">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="edit-toggle-button cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-raised hover:bg-surface-overlay transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="copy-button cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand bg-brand-light hover:bg-brand/20 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {editing ? (
              <div className="edit-content-wrapper">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="edit-content-textarea w-full rounded-lg border border-border-focus bg-surface p-4 text-sm text-text-primary font-sans leading-relaxed resize-y min-h-[200px] max-h-[50vh] focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
                <div className="edit-actions pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="done-edit-button btn-primary inline-flex items-center gap-1.5 text-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Done editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-content-wrapper rounded-lg border border-border bg-surface p-4 max-h-[50vh] overflow-y-auto">
                <pre className="result-content whitespace-pre-wrap text-sm text-text-primary font-sans leading-relaxed">
                  {content}
                </pre>
              </div>
            )}

            {/* Download actions */}
            <div className="download-actions flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="download-pdf-button cursor-pointer flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadDoc}
                disabled={downloading}
                className="download-doc-button cursor-pointer flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                DOC
              </button>
            </div>

            <div className="result-footer flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("select_type");
                  setContent(null);
                }}
                className="back-button cursor-pointer flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Generate another
              </button>
              <button
                type="button"
                onClick={resetAndClose}
                className="done-button btn-primary text-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
