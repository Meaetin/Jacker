"use client";

import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputModeToggle } from "./input-mode-toggle";

type InputMode = "paste" | "url";

interface EmptyStateProps {
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
  profileReady: boolean;
}

export function EmptyState({
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
  profileReady,
}: EmptyStateProps) {
  return (
    <div className="empty-state-wrapper flex flex-col items-center text-center py-12 max-w-2xl mx-auto">
      <div className="empty-state-illustration mb-6">
        <Target className="h-12 w-12 text-brand/30" />
      </div>
      <h1 className="empty-state-title font-display text-2xl font-bold text-text-primary mb-2">
        Analyze your first job
      </h1>
      <p className="empty-state-subtitle text-sm text-text-secondary mb-8 max-w-md">
        Paste a job description or use the Chrome extension to get an instant fit
        score against your profile.
      </p>

      <div className="empty-state-form w-full card space-y-4 text-left">
        {!profileReady && (
          <div className="profile-warning-banner rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Set up your CV and profile first on the CV &amp; Profile page.
          </div>
        )}

        <InputModeToggle value={inputMode} onChange={onInputModeChange} />

        {inputMode === "paste" && (
          <div className="empty-state-textarea-wrapper relative">
            <Textarea
              id="empty-job-description"
              label="Job Description"
              rows={12}
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste full job description here..."
              disabled={loading}
            />
            {jobDescription.length > 0 && (
              <span className="empty-state-char-count absolute bottom-14 right-3 text-xs text-text-muted">
                {jobDescription.length.toLocaleString()} / 60,000
              </span>
            )}
          </div>
        )}

        {inputMode === "url" && (
          <Input
            id="empty-job-url"
            type="url"
            label="Job Posting URL"
            value={jobUrl}
            onChange={(e) => onJobUrlChange(e.target.value)}
            placeholder="https://company.com/careers/job-id"
            disabled={loading}
          />
        )}

        <div className="empty-state-metadata grid gap-3 md:grid-cols-2">
          <Input
            id="empty-company-name"
            label="Company Name (optional)"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Stripe"
          />
          <Input
            id="empty-job-title"
            label="Job Title (optional)"
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder="Software Engineer"
          />
        </div>

        <Button onClick={onSubmit} disabled={!canSubmit}>
          {loading
            ? inputMode === "url"
              ? "Scraping and analyzing..."
              : "Analyzing..."
            : "Analyze Fit"}
        </Button>

        {error && (
          <p className="empty-state-error text-sm text-status-rejected">{error}</p>
        )}
      </div>
    </div>
  );
}
