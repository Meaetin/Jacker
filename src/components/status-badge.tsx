import type { ApplicationStatus } from "@/types/application";

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

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
