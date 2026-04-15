"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import type { ApplicationStatus } from "@/types/application";
import { APPLICATION_STATUSES } from "@/types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview: "Interview",
  assessment: "Assessment",
  rejected: "Rejected",
  offer: "Offer",
  unknown: "Unknown",
};

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  applied: "badge-status-applied",
  interview: "badge-status-interview",
  assessment: "badge-status-assessment",
  rejected: "badge-status-rejected",
  offer: "badge-status-offer",
  unknown: "badge-status-unknown",
};

const NEXT_STAGES: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  applied: ["assessment", "interview", "rejected"],
  assessment: ["interview", "rejected"],
  interview: ["offer", "rejected"],
};

interface StatusChangeProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
}

export function StatusChange({ applicationId, currentStatus }: StatusChangeProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleChange(newStatus: ApplicationStatus) {
    if (newStatus === status) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  const nextStages = NEXT_STAGES[status] ?? [];

  return (
    <div className="status-change relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`status-change-badge badge flex items-center gap-1 cursor-pointer ${STATUS_CLASSES[status]}`}
      >
        {STATUS_LABELS[status]}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="status-dropdown-menu absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-soft-md z-20">
          {APPLICATION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              disabled={loading}
              className={`status-dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-raised text-left ${
                s === status ? "text-brand font-medium" : "text-text-primary"
              }`}
            >
              <span className="w-4 flex-shrink-0">
                {s === status && <Check className="h-3.5 w-3.5" />}
              </span>
              {STATUS_LABELS[s]}
            </button>
          ))}

          {nextStages.length > 0 && (
            <div className="status-quick-actions border-t border-border mt-1 pt-1 px-3 py-1">
              <p className="text-xs text-text-muted mb-1.5">Quick actions</p>
              <div className="flex flex-wrap gap-1.5">
                {nextStages.map((next) => (
                  <button
                    key={next}
                    onClick={() => handleChange(next)}
                    disabled={loading}
                    className="status-quick-action rounded-md px-2 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary border border-border"
                  >
                    {STATUS_LABELS[next]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
