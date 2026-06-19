"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, LoaderCircle, Sparkles, FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type {
  CandidateProfileData,
  CandidateProfileRecord,
  EducationEntry,
  WorkExperienceEntry,
} from "@/types/profile";
import { DEFAULT_PROFILE_DATA } from "@/lib/profile/defaults";

interface ProfileWorkspaceProps {
  initialProfile: CandidateProfileRecord | null;
  isDemo?: boolean;
}

const EMPTY_EDUCATION: EducationEntry = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  grade: "",
};

const EMPTY_WORK_EXPERIENCE: WorkExperienceEntry = {
  job_title: "",
  company: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

const CV_ACCEPTED_MIME = "application/pdf";
const CV_MAX_FILE_SIZE = 5 * 1024 * 1024;

const RELOCATE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Open to discussion", label: "Open to discussion" },
];

function EducationEditor({
  entries,
  onChange,
  disabled,
}: {
  entries: EducationEntry[];
  onChange: (value: EducationEntry[]) => void;
  disabled: boolean;
}) {
  function updateEntry(index: number, field: keyof EducationEntry, value: string) {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  return (
    <div className="education-editor space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="education-entry-card rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="education-entry-fields grid gap-2 sm:grid-cols-2">
            <Input label="Institution" value={entry.institution} onChange={(e) => updateEntry(i, "institution", e.target.value)} placeholder="Stanford University" disabled={disabled} />
            <Input label="Degree" value={entry.degree} onChange={(e) => updateEntry(i, "degree", e.target.value)} placeholder="BSc" disabled={disabled} />
            <Input label="Field of study" value={entry.field_of_study} onChange={(e) => updateEntry(i, "field_of_study", e.target.value)} placeholder="Computer Science" disabled={disabled} />
            <Input label="Grade" value={entry.grade} onChange={(e) => updateEntry(i, "grade", e.target.value)} placeholder="First Class / 3.9 GPA" disabled={disabled} />
            <Input label="Start" value={entry.start_date} onChange={(e) => updateEntry(i, "start_date", e.target.value)} placeholder="Sep 2018" disabled={disabled} />
            <Input label="End" value={entry.end_date} onChange={(e) => updateEntry(i, "end_date", e.target.value)} placeholder="Jun 2022" disabled={disabled} />
          </div>
          {!disabled && (
            <button
              onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
              className="education-entry-remove flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-status-rejected"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          onClick={() => onChange([...entries, { ...EMPTY_EDUCATION }])}
          className="education-add-button flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add education
        </button>
      )}
    </div>
  );
}

function WorkExperienceEditor({
  entries,
  onChange,
  disabled,
}: {
  entries: WorkExperienceEntry[];
  onChange: (value: WorkExperienceEntry[]) => void;
  disabled: boolean;
}) {
  function updateEntry(index: number, patch: Partial<WorkExperienceEntry>) {
    const updated = [...entries];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  }

  return (
    <div className="work-experience-editor space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="work-experience-entry-card rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="work-experience-entry-fields grid gap-2 sm:grid-cols-2">
            <Input label="Job title" value={entry.job_title} onChange={(e) => updateEntry(i, { job_title: e.target.value })} placeholder="Senior Backend Engineer" disabled={disabled} />
            <Input label="Company" value={entry.company} onChange={(e) => updateEntry(i, { company: e.target.value })} placeholder="Acme Inc." disabled={disabled} />
            <Input label="Location" value={entry.location} onChange={(e) => updateEntry(i, { location: e.target.value })} placeholder="Singapore" disabled={disabled} />
            <Input label="Start" value={entry.start_date} onChange={(e) => updateEntry(i, { start_date: e.target.value })} placeholder="Jan 2021" disabled={disabled} />
            <Input
              label="End"
              value={entry.is_current ? "Present" : entry.end_date}
              onChange={(e) => updateEntry(i, { end_date: e.target.value })}
              placeholder="Dec 2023"
              disabled={disabled || entry.is_current}
            />
          </div>
          <label className="work-experience-current-toggle flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="work-experience-current-checkbox h-4 w-4 rounded border-border accent-brand"
              checked={entry.is_current}
              onChange={(e) => updateEntry(i, { is_current: e.target.checked, end_date: e.target.checked ? "" : entry.end_date })}
              disabled={disabled}
            />
            I currently work here
          </label>
          <Textarea label="Description" rows={3} value={entry.description} onChange={(e) => updateEntry(i, { description: e.target.value })} placeholder="Key responsibilities and achievements" disabled={disabled} />
          {!disabled && (
            <button
              onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
              className="work-experience-entry-remove flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-status-rejected"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          onClick={() => onChange([...entries, { ...EMPTY_WORK_EXPERIENCE }])}
          className="work-experience-add-button flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add work experience
        </button>
      )}
    </div>
  );
}

export function ProfileWorkspace({ initialProfile, isDemo = false }: ProfileWorkspaceProps) {
  const initialData = initialProfile?.profile_data ?? DEFAULT_PROFILE_DATA;
  const initialCvMarkdown = initialProfile?.cv_markdown ?? "";

  const [cvMarkdown, setCvMarkdown] = useState(initialCvMarkdown);
  const [profileData, setProfileData] = useState<CandidateProfileData>(initialData);

  // Baseline reflecting what is persisted. Updated after every successful save
  // or upload so the dirty check compares against the live saved state rather
  // than the stale initial props (which never change after mount).
  const [savedCvMarkdown, setSavedCvMarkdown] = useState(initialCvMarkdown);
  const [savedProfileData, setSavedProfileData] = useState<CandidateProfileData>(initialData);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialProfile?.updated_at ?? null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    if (cvMarkdown !== savedCvMarkdown) return true;
    return JSON.stringify(profileData) !== JSON.stringify(savedProfileData);
  }, [cvMarkdown, profileData, savedCvMarkdown, savedProfileData]);

  const lastUpdated = useMemo(() => {
    if (!updatedAt) return null;
    return new Date(updatedAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [updatedAt]);

  function updateProfile(path: keyof CandidateProfileData, value: CandidateProfileData[keyof CandidateProfileData]) {
    setProfileData((prev) => ({ ...prev, [path]: value }));
  }

  function updateCandidateField(field: keyof CandidateProfileData["candidate"], value: string) {
    updateProfile("candidate", { ...profileData.candidate, [field]: value });
  }

  function updatePersonalField(field: keyof CandidateProfileData["personal_details"], value: string) {
    updateProfile("personal_details", { ...profileData.personal_details, [field]: value });
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function resetFileInput() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setUploadError(null);
    setSuccessMessage(null);

    if (!file) {
      resetFileInput();
      return;
    }

    const isPdf =
      file.type === CV_ACCEPTED_MIME && file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Please choose a PDF file.");
      resetFileInput();
      return;
    }

    if (file.size === 0 || file.size > CV_MAX_FILE_SIZE) {
      setUploadError("PDF must be between 1 byte and 5MB.");
      resetFileInput();
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Please choose a PDF file.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setSuccessMessage(null);

    // Clear stale data while the new CV is being processed
    setCvMarkdown("");
    setProfileData(DEFAULT_PROFILE_DATA);

    try {
      const payload = new FormData();
      payload.append("cv", selectedFile);

      const res = await fetch("/api/profile/cv-upload", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      const generated = data.profile as CandidateProfileRecord;
      const generatedMarkdown = generated.cv_markdown ?? "";
      setCvMarkdown(generatedMarkdown);
      setProfileData(generated.profile_data);
      // Upload persists immediately, so move the saved baseline forward.
      setSavedCvMarkdown(generatedMarkdown);
      setSavedProfileData(generated.profile_data);
      setUpdatedAt(generated.updated_at ?? null);
      setSuccessMessage("CV uploaded and profile generated.");
    } catch {
      setUploadError("Upload failed due to a network error.");
    } finally {
      setUploading(false);
      // Reset the picker once processing finishes (success or failure) so the
      // button returns to its disabled "Generate Profile" state.
      resetFileInput();
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_data: profileData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Save failed");
        return;
      }

      const saved = data.profile as CandidateProfileRecord;
      setProfileData(saved.profile_data);
      setSavedProfileData(saved.profile_data);
      setUpdatedAt(saved.updated_at ?? null);
      setSuccessMessage("Profile saved.");
    } catch {
      setSaveError("Save failed due to a network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateSummary() {
    setRegenerating(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/profile/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_data: profileData, cv_markdown: cvMarkdown }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Summary generation failed");
        return;
      }

      setProfileData((prev) => ({ ...prev, ai_summary: data.ai_summary }));
      setSuccessMessage("AI summary regenerated. Save to keep it.");
    } catch {
      setSaveError("Summary generation failed due to a network error.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="profile-page space-y-6 max-w-4xl mx-auto">
      <div className="profile-upload-section card space-y-4">
        <h1 className="profile-title font-display text-2xl font-bold text-text-primary">CV & Profile</h1>
        <p className="profile-description text-sm text-text-secondary">
          {isDemo
            ? "This is a sample candidate profile for demonstration. Profile editing is disabled in demo mode."
            : "Upload a PDF CV to auto-generate your markdown CV and profile draft. Then edit and save."}
        </p>

        {!isDemo && (
          <div className="cv-upload-form space-y-3">
            <div className="cv-file-field space-y-1.5">
              <span className="cv-file-label text-sm font-medium text-text-primary">
                Upload CV (PDF)
              </span>
              <input
                ref={fileInputRef}
                id="cv"
                name="cv"
                type="file"
                accept="application/pdf,.pdf"
                className="cv-file-input sr-only"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {selectedFile ? (
                <div className="cv-file-chosen flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                  <FileText className="cv-file-icon h-4 w-4 shrink-0 text-brand" />
                  <span className="cv-file-name truncate text-sm text-text-primary">
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={uploading}
                    className="cv-file-rechoose ml-auto shrink-0 text-sm text-brand transition-colors hover:text-brand-hover disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading}
                  className="cv-file-choose-button input-field flex w-full items-center text-left text-text-muted transition-colors hover:border-brand disabled:opacity-50"
                >
                  Choose File
                </button>
              )}
            </div>
            <Button type="button" onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? (
                <span className="upload-button-loading flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Generating…
                </span>
              ) : (
                "Generate Profile"
              )}
            </Button>
          </div>
        )}

        {lastUpdated && <p className="text-xs text-text-muted">Last updated: {lastUpdated}</p>}
        {uploadError && <p className="text-sm text-status-rejected">{uploadError}</p>}
        {saveError && <p className="text-sm text-status-rejected">{saveError}</p>}
        {successMessage && <p className="text-sm text-status-offer">{successMessage}</p>}
      </div>

      <div className="cv-markdown-section card space-y-3">
        <div className="cv-markdown-header space-y-1">
          <h2 className="font-display text-lg font-semibold text-text-primary">CV Markdown</h2>
          <p className="cv-markdown-hint text-sm text-text-secondary">
            Generated from your uploaded resume. Upload a new CV to regenerate it.
          </p>
        </div>
        {cvMarkdown ? (
          <pre className="cv-markdown-content max-h-[32rem] overflow-auto rounded-lg border border-border bg-surface p-4 whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-text-primary">
            {cvMarkdown}
          </pre>
        ) : (
          <p className="cv-markdown-empty rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-text-muted">
            No CV generated yet. Upload a PDF resume above to generate it.
          </p>
        )}
      </div>

      <div className="candidate-info-section card space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Candidate</h2>
        <div className="candidate-fields-grid grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={profileData.candidate.full_name} onChange={(e) => updateCandidateField("full_name", e.target.value)} disabled={isDemo} />
          <Input label="Email" value={profileData.candidate.email} onChange={(e) => updateCandidateField("email", e.target.value)} disabled={isDemo} />
          <Input label="Phone" value={profileData.candidate.phone} onChange={(e) => updateCandidateField("phone", e.target.value)} disabled={isDemo} />
          <Input label="Location" value={profileData.candidate.location} onChange={(e) => updateCandidateField("location", e.target.value)} disabled={isDemo} />
          <Input label="LinkedIn" value={profileData.candidate.linkedin} onChange={(e) => updateCandidateField("linkedin", e.target.value)} disabled={isDemo} />
          <Input label="Portfolio" value={profileData.candidate.portfolio_url} onChange={(e) => updateCandidateField("portfolio_url", e.target.value)} disabled={isDemo} />
          <Input label="GitHub" value={profileData.candidate.github} onChange={(e) => updateCandidateField("github", e.target.value)} disabled={isDemo} />
          <Input label="Twitter/X" value={profileData.candidate.twitter} onChange={(e) => updateCandidateField("twitter", e.target.value)} disabled={isDemo} />
        </div>
      </div>

      <div className="personal-details-section card space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Additional Details</h2>
        <p className="personal-details-hint text-sm text-text-secondary">
          Details that commonly appear on job application forms.
        </p>
        <div className="personal-details-grid grid gap-3 sm:grid-cols-2">
          <Input label="Address" value={profileData.personal_details.address} onChange={(e) => updatePersonalField("address", e.target.value)} disabled={isDemo} />
          <Input label="City" value={profileData.personal_details.city} onChange={(e) => updatePersonalField("city", e.target.value)} disabled={isDemo} />
          <Input label="Postal code" value={profileData.personal_details.postal_code} onChange={(e) => updatePersonalField("postal_code", e.target.value)} disabled={isDemo} />
          <Input label="Country" value={profileData.personal_details.country} onChange={(e) => updatePersonalField("country", e.target.value)} disabled={isDemo} />
          <Input label="Citizenship" value={profileData.personal_details.citizenship} onChange={(e) => updatePersonalField("citizenship", e.target.value)} disabled={isDemo} />
          <Input label="Work authorization" value={profileData.personal_details.work_authorization} onChange={(e) => updatePersonalField("work_authorization", e.target.value)} placeholder="Citizen / PR / Requires sponsorship" disabled={isDemo} />
          <Input label="Current occupation" value={profileData.personal_details.current_occupation} onChange={(e) => updatePersonalField("current_occupation", e.target.value)} disabled={isDemo} />
          <Input label="Notice period" value={profileData.personal_details.notice_period} onChange={(e) => updatePersonalField("notice_period", e.target.value)} placeholder="Immediate / 1 month" disabled={isDemo} />
          <Select label="Willing to relocate" options={RELOCATE_OPTIONS} value={profileData.personal_details.willing_to_relocate} onChange={(e) => updatePersonalField("willing_to_relocate", e.target.value)} disabled={isDemo} />
          <Input label="Date of birth" value={profileData.personal_details.date_of_birth} onChange={(e) => updatePersonalField("date_of_birth", e.target.value)} placeholder="1995-04-21" disabled={isDemo} />
          <Input label="Gender" value={profileData.personal_details.gender} onChange={(e) => updatePersonalField("gender", e.target.value)} disabled={isDemo} />
        </div>
      </div>

      <div className="education-section card space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Education</h2>
        <EducationEditor
          entries={profileData.education}
          onChange={(entries) => updateProfile("education", entries)}
          disabled={isDemo}
        />
      </div>

      <div className="work-experience-section card space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Work Experience</h2>
        <WorkExperienceEditor
          entries={profileData.work_experience}
          onChange={(entries) => updateProfile("work_experience", entries)}
          disabled={isDemo}
        />
      </div>

      <div className="ai-summary-section card space-y-4">
        <div className="ai-summary-header flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text-primary">AI Summary</h2>
          {!isDemo && (
            <Button variant="secondary" onClick={handleRegenerateSummary} disabled={regenerating || uploading}>
              {regenerating ? (
                <span className="ai-summary-regenerate-loading flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Regenerating…
                </span>
              ) : (
                <span className="ai-summary-regenerate flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Regenerate
                </span>
              )}
            </Button>
          )}
        </div>
        <p className="ai-summary-hint text-sm text-text-secondary">
          A breakdown of what we know about you. Used to answer questions and tailor documents.
        </p>
        <Textarea
          label="Summary"
          rows={8}
          value={profileData.ai_summary}
          onChange={(e) => updateProfile("ai_summary", e.target.value)}
          placeholder="Upload a CV or click Regenerate to generate a summary."
          disabled={isDemo}
        />
      </div>

      {!isDemo && (
        <div className="save-profile-actions flex items-center gap-3 pb-20">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      )}

      {!isDemo && (
        <AnimatePresence>
          {isDirty && !saving && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="sticky-save-bar fixed bottom-0 right-0 left-56 z-40 border-t border-border bg-surface px-6 py-3 shadow-soft-md"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <span className="sticky-save-hint text-sm text-text-secondary">
                  Unsaved changes
                </span>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
