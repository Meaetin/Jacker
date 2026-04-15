"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputModeToggle } from "./input-mode-toggle";

type InputMode = "paste" | "url";

interface InputPanelProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose?: () => void;
  profileReady: boolean;
  prefillActive: boolean;
}

export function InputPanel({
  inputMode,
  onInputModeChange,
  jobDescription,
  onJobDescriptionChange,
  jobUrl,
  onJobUrlChange,
  companyName,
  onCompanyNameChange,
  jobTitle,
  onJobTitleChange,
  loading,
  error,
  canSubmit,
  onSubmit,
  onClose,
  profileReady,
  prefillActive,
}: InputPanelProps) {
  const [showPrefillToast, setShowPrefillToast] = useState(false);

  useEffect(() => {
    if (prefillActive) {
      setShowPrefillToast(true);
      const timer = setTimeout(() => setShowPrefillToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [prefillActive]);

  return (
    <div className="input-panel card space-y-4">
      <div className="input-panel-header flex items-center justify-between">
        <h2 className="input-panel-title font-display text-lg font-semibold text-text-primary">
          New Analysis
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="input-panel-close rounded-md p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPrefillToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="prefill-toast flex items-center gap-2 rounded-lg bg-brand-light border border-brand/20 p-3 text-sm text-brand"
          >
            <Sparkles className="prefill-toast-icon h-4 w-4 flex-shrink-0" />
            <span>Job description imported from Chrome extension</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!profileReady && (
        <div className="profile-warning-banner rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Set up your CV and profile first on the CV &amp; Profile page.
        </div>
      )}

      <InputModeToggle value={inputMode} onChange={onInputModeChange} />

      {inputMode === "paste" && (
        <div className="input-panel-textarea-wrapper relative">
          <Textarea
            id="panel-job-description"
            label="Job Description"
            rows={10}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste full job description here..."
            disabled={loading}
          />
          {jobDescription.length > 0 && (
            <span className="input-panel-char-count absolute bottom-14 right-3 text-xs text-text-muted">
              {jobDescription.length.toLocaleString()} / 60,000
            </span>
          )}
        </div>
      )}

      {inputMode === "url" && (
        <Input
          id="panel-job-url"
          type="url"
          label="Job Posting URL"
          value={jobUrl}
          onChange={(e) => onJobUrlChange(e.target.value)}
          placeholder="https://company.com/careers/job-id"
          disabled={loading}
        />
      )}

      <div className="input-panel-metadata grid gap-3 grid-cols-2">
        <Input
          id="panel-company-name"
          label="Company (optional)"
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          placeholder="Stripe"
        />
        <Input
          id="panel-job-title"
          label="Title (optional)"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          placeholder="Software Engineer"
        />
      </div>

      <Button onClick={onSubmit} disabled={!canSubmit} className="w-full">
        {loading
          ? inputMode === "url"
            ? "Scraping and analyzing..."
            : "Analyzing..."
          : "Analyze Fit"}
      </Button>

      {error && <p className="input-panel-error text-sm text-status-rejected">{error}</p>}
    </div>
  );
}
