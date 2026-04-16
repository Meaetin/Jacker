"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { CandidateProfileData, CandidateProfileRecord, ProofPoint } from "@/types/profile";
import { DEFAULT_PROFILE_DATA } from "@/lib/profile/defaults";

interface ProfileWorkspaceProps {
  initialProfile: CandidateProfileRecord | null;
  isDemo?: boolean;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function ProofPointEditor({
  proofPoints,
  onChange,
}: {
  proofPoints: ProofPoint[];
  onChange: (value: ProofPoint[]) => void;
}) {
  function addProofPoint() {
    onChange([...proofPoints, { name: "", url: "", hero_metric: "" }]);
  }

  function updateProofPoint(index: number, field: keyof ProofPoint, value: string) {
    const updated = [...proofPoints];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeProofPoint(index: number) {
    onChange(proofPoints.filter((_, i) => i !== index));
  }

  return (
    <div className="proof-point-editor space-y-3">
      {proofPoints.map((point, i) => (
        <div key={i} className="proof-point-card flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
          <div className="proof-point-fields flex-1 grid gap-2 sm:grid-cols-3">
            <Input
              label="Name"
              value={point.name}
              onChange={(e) => updateProofPoint(i, "name", e.target.value)}
              placeholder="Led platform migration"
            />
            <Input
              label="URL"
              value={point.url}
              onChange={(e) => updateProofPoint(i, "url", e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Metric"
              value={point.hero_metric}
              onChange={(e) => updateProofPoint(i, "hero_metric", e.target.value)}
              placeholder="3x throughput improvement"
            />
          </div>
          <button
            onClick={() => removeProofPoint(i)}
            className="proof-point-remove mt-5 flex-shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-status-rejected"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addProofPoint}
        className="proof-point-add-button flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add proof point
      </button>
    </div>
  );
}

export function ProfileWorkspace({ initialProfile, isDemo = false }: ProfileWorkspaceProps) {
  const initialData = initialProfile?.profile_data ?? DEFAULT_PROFILE_DATA;

  const [cvMarkdown, setCvMarkdown] = useState(initialProfile?.cv_markdown ?? "");
  const [profileData, setProfileData] = useState<CandidateProfileData>(initialData);
  const [superpowersText, setSuperpowersText] = useState(initialData.narrative.superpowers.join("\n"));

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialCvMarkdown = initialProfile?.cv_markdown ?? "";

  const isDirty = useMemo(() => {
    if (cvMarkdown !== initialCvMarkdown) return true;
    if (superpowersText !== initialData.narrative.superpowers.join("\n")) return true;
    if (JSON.stringify(profileData.candidate) !== JSON.stringify(initialData.candidate)) return true;
    if (JSON.stringify(profileData.narrative.proof_points) !== JSON.stringify(initialData.narrative.proof_points)) return true;
    if (profileData.narrative.headline !== initialData.narrative.headline) return true;
    if (profileData.narrative.exit_story !== initialData.narrative.exit_story) return true;
    return false;
  }, [cvMarkdown, superpowersText, profileData, initialCvMarkdown, initialData]);

  const lastUpdated = useMemo(() => {
    if (!initialProfile?.updated_at) return null;
    return new Date(initialProfile.updated_at).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [initialProfile?.updated_at]);

  function updateProfile(path: keyof CandidateProfileData, value: CandidateProfileData[keyof CandidateProfileData]) {
    setProfileData((prev) => ({ ...prev, [path]: value }));
  }

  function updateCandidateField(field: keyof CandidateProfileData["candidate"], value: string) {
    updateProfile("candidate", { ...profileData.candidate, [field]: value });
  }

  function updateNarrativeField(field: keyof Omit<CandidateProfileData["narrative"], "superpowers" | "proof_points">, value: string) {
    updateProfile("narrative", { ...profileData.narrative, [field]: value });
  }

  function updateProofPoints(proofPoints: ProofPoint[]) {
    updateProfile("narrative", { ...profileData.narrative, proof_points: proofPoints });
  }

  async function handleUpload(formData: FormData) {
    const file = formData.get("cv");
    if (!(file instanceof File) || !file.name) {
      setUploadError("Please select a PDF file.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const payload = new FormData();
      payload.append("cv", file);

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
      setCvMarkdown(generated.cv_markdown ?? "");
      setProfileData(generated.profile_data);
      setSuperpowersText(generated.profile_data.narrative.superpowers.join("\n"));
      setSuccessMessage("CV uploaded and profile generated.");
    } catch {
      setUploadError("Upload failed due to a network error.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    const payload: CandidateProfileData = {
      ...profileData,
      narrative: {
        ...profileData.narrative,
        superpowers: splitLines(superpowersText),
      },
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_markdown: cvMarkdown,
          profile_data: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Save failed");
        return;
      }

      setProfileData(data.profile.profile_data);
      setSuccessMessage("Profile saved.");
    } catch {
      setSaveError("Save failed due to a network error.");
    } finally {
      setSaving(false);
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
          <form action={handleUpload} className="cv-upload-form space-y-3">
            <Input id="cv" name="cv" type="file" accept="application/pdf" label="Upload CV (PDF)" />
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload and Generate"}
            </Button>
          </form>
        )}

        {lastUpdated && <p className="text-xs text-text-muted">Last updated: {lastUpdated}</p>}
        {uploadError && <p className="text-sm text-status-rejected">{uploadError}</p>}
        {saveError && <p className="text-sm text-status-rejected">{saveError}</p>}
        {successMessage && <p className="text-sm text-status-offer">{successMessage}</p>}
      </div>

      <div className="cv-markdown-section card space-y-4">
        <Textarea
          id="cv_markdown"
          label="CV Markdown"
          rows={18}
          value={cvMarkdown}
          onChange={(e) => setCvMarkdown(e.target.value)}
          disabled={isDemo}
        />
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

      <div className="narrative-section card space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">Narrative</h2>
        <Input label="Headline" value={profileData.narrative.headline} onChange={(e) => updateNarrativeField("headline", e.target.value)} disabled={isDemo} />
        <Textarea label="Exit story" rows={3} value={profileData.narrative.exit_story} onChange={(e) => updateNarrativeField("exit_story", e.target.value)} disabled={isDemo} />
        <Textarea label="Superpowers (one per line)" rows={4} value={superpowersText} onChange={(e) => setSuperpowersText(e.target.value)} disabled={isDemo} />
        {!isDemo && (
          <div className="proof-points-section">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Proof Points</h3>
            <ProofPointEditor
              proofPoints={profileData.narrative.proof_points}
              onChange={updateProofPoints}
            />
          </div>
        )}
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
