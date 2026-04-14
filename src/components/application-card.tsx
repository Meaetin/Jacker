import Link from "next/link";
import type { Application } from "@/types/application";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/utils/date";

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Link href={`/dashboard/${application.id}`}>
      <div className="card-raised hover:border-border-focus transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-text-primary">
              {application.company ?? "Unknown Company"}
            </h3>
            <p className="text-sm text-text-secondary">{application.role ?? "Unknown Role"}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
          <span>{formatDate(application.application_updated_at ?? application.updated_at)}</span>
          {application.interview_date && (
            <span>Interview: {formatDate(application.interview_date)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
