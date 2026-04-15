"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Application, ApplicationStatus } from "@/types/application";
import { APPLICATION_STATUSES } from "@/types/application";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface ApplicationFormProps {
  application: Application;
  onSuccess?: () => void;
}

export function ApplicationForm({ application, onSuccess }: ApplicationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company: application.company ?? "",
    role: application.role ?? "",
    status: application.status,
    interview_date: application.interview_date ?? "",
    interview_time: application.interview_time ?? "",
    location: application.location ?? "",
    notes: application.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/dashboard/${application.id}`);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const statusOptions = APPLICATION_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  return (
    <form onSubmit={handleSubmit} className="application-form space-y-6">
      <div className="form-section space-y-4">
        <h3 className="form-section-title text-sm font-semibold text-text-secondary uppercase tracking-wide">Basic Info</h3>
        <Input
          id="company"
          label="Company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
        <Input
          id="role"
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        />
      </div>

      <div className="form-section space-y-4">
        <h3 className="form-section-title text-sm font-semibold text-text-secondary uppercase tracking-wide">Status &amp; Dates</h3>
        <Select
          id="status"
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value as ApplicationStatus })
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="interview_date"
            label="Interview Date"
            type="date"
            value={formData.interview_date}
            onChange={(e) =>
              setFormData({ ...formData, interview_date: e.target.value })
            }
          />
          <Input
            id="interview_time"
            label="Interview Time"
            value={formData.interview_time}
            onChange={(e) =>
              setFormData({ ...formData, interview_time: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-section space-y-4">
        <h3 className="form-section-title text-sm font-semibold text-text-secondary uppercase tracking-wide">Details</h3>
        <Input
          id="location"
          label="Location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
        />
        <Textarea
          id="notes"
          label="Notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
