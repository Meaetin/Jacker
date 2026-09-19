import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ApplicationsContent } from "@/components/applications-content";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanSkeleton } from "@/components/kanban-skeleton";
import { getApplications, getApplicationStats } from "@/lib/db/applications";
import { getKanbanColumnOrder } from "@/lib/db/user-preferences";
import { APPLICATION_STATUSES } from "@/types/application";
import type { Application, ApplicationStatus } from "@/types/application";

const PAGE_SIZE = 20;
const KANBAN_LIMIT = 1000;

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

  const initialView = params.view === "kanban" ? "kanban" : "table";
  const status = (APPLICATION_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as ApplicationStatus)
    : undefined;
  const search = params.search || undefined;

  // Table view loads the first page (20); kanban needs the whole board.
  const listFilters =
    initialView === "kanban"
      ? { search, page: 1, limit: KANBAN_LIMIT, view: "kanban" as const }
      : { status, search, page: 1, limit: PAGE_SIZE, view: "table" as const };

  const [{ data: tokens }, { data: applications, count }, stats, columnOrder] = await Promise.all([
    createAdminClient().from("user_tokens").select("user_id, last_sync_at, pending_emails").eq("user_id", userId).maybeSingle(),
    getApplications(userId, listFilters),
    getApplicationStats(userId),
    getKanbanColumnOrder(userId),
  ]);

  const gmailConnected = !!tokens;
  const lastSyncAt = tokens?.last_sync_at ?? null;
  // Emails a capped run left behind, so the dashboard can finish the job.
  const pendingEmails = tokens?.pending_emails ?? 0;

  return (
    <ApplicationsContent
      applications={(applications ?? []) as Application[]}
      total={count ?? 0}
      stats={stats}
      userId={userId}
      gmailConnected={gmailConnected}
      lastSyncAt={lastSyncAt}
      pendingEmails={pendingEmails}
      isDemo={isDemo}
      initialView={initialView}
      initialStatus={params.status ?? ""}
      initialSearch={params.search ?? ""}
      initialColumnOrder={columnOrder}
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
