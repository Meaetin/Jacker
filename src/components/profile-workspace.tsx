"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateProfileData, CandidateProfileRecord } from "@/types/profile";
import { DEFAULT_PROFILE_DATA } from "@/lib/profile/defaults";

interface ProfileWorkspaceProps {
  initialProfile: CandidateProfileRecord | null;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function ProfileWorkspace({ initialProfile }: ProfileWorkspaceProps) {
  const initialData = initialProfile?.profile_data ?? DEFAULT_PROFILE_DATA;

  const [cvMarkdown, setCvMarkdown] = useState(initialProfile?.cv_markdown ?? "");
  const [profileData, setProfileData] = useState<CandidateProfileData>(initialData);

  const [primaryRolesText, setPrimaryRolesText] = useState(initialData.target_roles.primary.join("\n"));
  const [superpowersText, setSuperpowersText] = useState(initialData.narrative.superpowers.join("\n"));
  const [archetypesJson, setArchetypesJson] = useState(toPrettyJson(initialData.target_roles.archetypes));
  const [proofPointsJson, setProofPointsJson] = useState(toPrettyJson(initialData.narrative.proof_points));

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  function updateCompensationField(field: keyof CandidateProfileData["compensation"], value: string) {
    updateProfile("compensation", { ...profileData.compensation, [field]: value });
  }

  function updateLocationField(field: keyof CandidateProfileData["location"], value: string) {
    updateProfile("location", { ...profileData.location, [field]: value });
  }

  function updateNarrativeField(field: keyof Omit<CandidateProfileData["narrative"], "superpowers" | "proof_points">, value: string) {
    updateProfile("narrative", { ...profileData.narrative, [field]: value });
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
      setPrimaryRolesText(generated.profile_data.target_roles.primary.join("\n"));
      setSuperpowersText(generated.profile_data.narrative.superpowers.join("\n"));
      setArchetypesJson(toPrettyJson(generated.profile_data.target_roles.archetypes));
      setProofPointsJson(toPrettyJson(generated.profile_data.narrative.proof_points));
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

    const archetypes = safeJsonParse<CandidateProfileData["target_roles"]["archetypes"]>(archetypesJson);
    if (!archetypes || !Array.isArray(archetypes)) {
      setSaving(false);
      setSaveError("Target role archetypes must be valid JSON array.");
      return;
    }

    const proofPoints = safeJsonParse<CandidateProfileData["narrative"]["proof_points"]>(proofPointsJson);
    if (!proofPoints || !Array.isArray(proofPoints)) {
      setSaving(false);
      setSaveError("Proof points must be valid JSON array.");
      return;
    }

    const payload: CandidateProfileData = {
      ...profileData,
      target_roles: {
        ...profileData.target_roles,
        primary: splitLines(primaryRolesText),
        archetypes,
      },
      narrative: {
        ...profileData.narrative,
        superpowers: splitLines(superpowersText),
        proof_points: proofPoints,
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
    <div className="profile-page space-y-6">
      <div className="card space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">CV & Profile</h1>
        <p className="text-sm text-text-secondary">
          Upload a PDF CV to auto-generate your markdown CV and profile draft. Then edit and save.
        </p>

        <form action={handleUpload} className="space-y-3">
          <Input id="cv" name="cv" type="file" accept="application/pdf" label="Upload CV (PDF)" />
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload and Generate"}
          </Button>
        </form>

        {lastUpdated && <p className="text-xs text-text-muted">Last updated: {lastUpdated}</p>}
        {uploadError && <p className="text-sm text-status-rejected">{uploadError}</p>}
        {saveError && <p className="text-sm text-status-rejected">{saveError}</p>}
        {successMessage && <p className="text-sm text-status-offer">{successMessage}</p>}
      </div>

      <div className="card space-y-4">
        <Textarea
          id="cv_markdown"
          label="CV Markdown"
          rows={18}
          value={cvMarkdown}
          onChange={(e) => setCvMarkdown(e.target.value)}
        />
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Candidate</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={profileData.candidate.full_name} onChange={(e) => updateCandidateField("full_name", e.target.value)} />
          <Input label="Email" value={profileData.candidate.email} onChange={(e) => updateCandidateField("email", e.target.value)} />
          <Input label="Phone" value={profileData.candidate.phone} onChange={(e) => updateCandidateField("phone", e.target.value)} />
          <Input label="Location" value={profileData.candidate.location} onChange={(e) => updateCandidateField("location", e.target.value)} />
          <Input label="LinkedIn" value={profileData.candidate.linkedin} onChange={(e) => updateCandidateField("linkedin", e.target.value)} />
          <Input label="Portfolio" value={profileData.candidate.portfolio_url} onChange={(e) => updateCandidateField("portfolio_url", e.target.value)} />
          <Input label="GitHub" value={profileData.candidate.github} onChange={(e) => updateCandidateField("github", e.target.value)} />
          <Input label="Twitter/X" value={profileData.candidate.twitter} onChange={(e) => updateCandidateField("twitter", e.target.value)} />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Target Roles</h2>
        <Textarea
          label="Primary roles (one per line)"
          rows={4}
          value={primaryRolesText}
          onChange={(e) => setPrimaryRolesText(e.target.value)}
        />
        <Textarea
          label="Archetypes JSON"
          rows={8}
          value={archetypesJson}
          onChange={(e) => setArchetypesJson(e.target.value)}
        />
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Narrative</h2>
        <Input label="Headline" value={profileData.narrative.headline} onChange={(e) => updateNarrativeField("headline", e.target.value)} />
        <Textarea label="Exit story" rows={3} value={profileData.narrative.exit_story} onChange={(e) => updateNarrativeField("exit_story", e.target.value)} />
        <Textarea label="Superpowers (one per line)" rows={4} value={superpowersText} onChange={(e) => setSuperpowersText(e.target.value)} />
        <Textarea label="Proof points JSON" rows={8} value={proofPointsJson} onChange={(e) => setProofPointsJson(e.target.value)} />
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Compensation & Location</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Target range" value={profileData.compensation.target_range} onChange={(e) => updateCompensationField("target_range", e.target.value)} />
          <Input label="Currency" value={profileData.compensation.currency} onChange={(e) => updateCompensationField("currency", e.target.value)} />
          <Input label="Minimum" value={profileData.compensation.minimum} onChange={(e) => updateCompensationField("minimum", e.target.value)} />
          <Input label="Flexibility" value={profileData.compensation.location_flexibility} onChange={(e) => updateCompensationField("location_flexibility", e.target.value)} />
          <Input label="Country" value={profileData.location.country} onChange={(e) => updateLocationField("country", e.target.value)} />
          <Input label="City" value={profileData.location.city} onChange={(e) => updateLocationField("city", e.target.value)} />
          <Input label="Timezone" value={profileData.location.timezone} onChange={(e) => updateLocationField("timezone", e.target.value)} />
          <Input label="Visa status" value={profileData.location.visa_status} onChange={(e) => updateLocationField("visa_status", e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3 pb-8">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
