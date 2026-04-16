import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { ApplicationsContent } from "@/components/applications-content";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUSES } from "@/types/application";
import type { Application } from "@/types/application";

interface SearchParams {
  status?: string;
  company?: string;
  search?: string;
  page?: string;
  gmail?: string;
  error?: string;
  view?: string;
}

interface DashboardPageProps {
  searchParams: Promise<SearchParams>;
}

async function getIsDemo(email: string | undefined): Promise<boolean> {
  const { isDemoUser } = await import("@/utils/demo");
  return isDemoUser(email);
}

function KanbanSkeleton() {
  return (
    <div className="kanban-skeleton flex gap-3 overflow-x-hidden">
      {[...APPLICATION_STATUSES.filter((s) => s !== "unknown"), "unknown" as const].map((status) => (
        <div
          key={status}
          className="kanban-skeleton-column flex-shrink-0 w-64 rounded-lg border border-border bg-surface-raised"
        >
          <div className="kanban-skeleton-header flex items-center justify-between px-3 py-2.5 border-b border-border">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="kanban-skeleton-cards flex flex-col gap-2 p-2">
            {Array.from({ length: status === "applied" ? 3 : status === "rejected" ? 2 : 1 }).map((_, i) => (
              <div key={i} className="kanban-skeleton-card bg-surface border border-border rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="table-skeleton space-y-3">
      <Skeleton className="h-10 w-full max-w-md" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

async function ApplicationsView({ params }: { params: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;
  const isDemo = await getIsDemo(user?.email);

  const [{ data: tokens }, { data: applications }] = await Promise.all([
    supabase.from("user_tokens").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("applications")
      .select()
      .eq("user_id", userId)
      .order("application_updated_at", { ascending: false, nullsFirst: false }),
  ]);

  const gmailConnected = !!tokens;
  const initialView = params.view === "kanban" ? "kanban" : "table";

  return (
    <ApplicationsContent
      applications={(applications ?? []) as Application[]}
      gmailConnected={gmailConnected}
      isDemo={isDemo}
      initialView={initialView}
      initialStatus={params.status ?? ""}
      initialSearch={params.search ?? ""}
    />
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const view = params.view === "kanban" ? "kanban" : "table";

  return (
    <div className="dashboard-page">
      <div className="dashboard-header mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Applications</h1>
      </div>

      {params.gmail === "connected" && (
        <div className="gmail-success-banner mb-4 rounded-lg bg-brand-light border border-brand/20 text-brand text-sm p-3">
          Gmail connected successfully. Sync your emails to get started.
        </div>
      )}

      {params.error === "gmail_no_code" && (
        <div className="gmail-error-banner mb-4 rounded-lg bg-red-50/60 border border-status-rejected/20 text-status-rejected text-sm p-3">
          Gmail connection was cancelled.
        </div>
      )}

      {params.error === "gmail_no_refresh_token" && (
        <div className="gmail-error-banner mb-4 rounded-lg bg-red-50/60 border border-status-rejected/20 text-status-rejected text-sm p-3">
          Gmail did not return a refresh token. Please try again.
        </div>
      )}

      <Suspense fallback={view === "kanban" ? <KanbanSkeleton /> : <TableSkeleton />}>
        <ApplicationsView params={params} />
      </Suspense>
    </div>
  );
}
