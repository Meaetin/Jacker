import { createClient } from "@/utils/supabase/server";
import { resolveDb, type Db } from "@/utils/supabase/db";
import type { Application, ApplicationWithSource, ApplicationStatus } from "@/types/application";
import { normalizeCompany } from "@/utils/normalize-company";
import { sanitizeEmailHtml } from "@/lib/email/sanitize-email-html";

interface ApplicationFilters {
  status?: ApplicationStatus;
  company?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getApplications(
  userId: string,
  filters: ApplicationFilters = {}
) {
  const supabase = await createClient();
  const { status, company, search, page = 1, limit = 20 } = filters;

  let query = supabase
    .from("applications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    // Deterministic total order so .range() windows never overlap or skip
    // (id is the tiebreaker for equal/NULL application_updated_at).
    .order("application_updated_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq("status", status);
  if (company) query = query.ilike("company", `%${company}%`);
  if (search) {
    query = query.or(
      `role.ilike.%${search}%,company.ilike.%${search}%,notes.ilike.%${search}%`
    );
  }

  return query;
}

export interface ApplicationStats {
  counts: Record<ApplicationStatus, number>;
  upcomingInterviews: number;
}

export async function getApplicationStats(
  userId: string
): Promise<ApplicationStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("application_stats", {
    p_user: userId,
  });

  const counts: Record<ApplicationStatus, number> = {
    applied: 0,
    interview: 0,
    assessment: 0,
    rejected: 0,
    offer: 0,
    unknown: 0,
  };
  let upcomingInterviews = 0;

  if (!error && Array.isArray(data)) {
    for (const row of data as {
      status: ApplicationStatus;
      count: number;
      upcoming_interviews: number;
    }[]) {
      if (row.status in counts) counts[row.status] = Number(row.count);
      upcomingInterviews = Number(row.upcoming_interviews) || upcomingInterviews;
    }
  }

  return { counts, upcomingInterviews };
}

export async function getApplicationById(
  id: string,
  userId: string
): Promise<ApplicationWithSource | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, raw_emails!source_email_id(subject, snippet, from_email, gmail_message_id, body_html, body_text)"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const email = data.raw_emails as unknown as {
    subject: string | null;
    snippet: string | null;
    from_email: string | null;
    gmail_message_id: string | null;
    body_html: string | null;
    body_text: string | null;
  } | null;

  return {
    ...(data as Application),
    email_subject: email?.subject ?? null,
    email_snippet: email?.snippet ?? null,
    email_from: email?.from_email ?? null,
    email_body_html: sanitizeEmailHtml(email?.body_html),
    email_body_text: email?.body_text ?? null,
    gmail_message_id: email?.gmail_message_id ?? null,
  };
}

export async function updateApplication(
  id: string,
  userId: string,
  fields: Record<string, unknown>,
  db?: Db
) {
  const supabase = await resolveDb(db);

  return supabase
    .from("applications")
    .update({ ...fields })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
}

export async function findApplicationByThread(
  threadId: string,
  userId: string,
  db?: Db
) {
  const supabase = await resolveDb(db);

  return supabase
    .from("applications")
    .select()
    .eq("gmail_thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();
}

export async function findApplicationByCompanyRole(
  company: string,
  role: string,
  userId: string,
  db?: Db
) {
  const supabase = await resolveDb(db);

  const normalizedCompany = normalizeCompany(company) ?? company;

  return supabase
    .from("applications")
    .select()
    .ilike("company", `%${normalizedCompany}%`)
    .ilike("role", `%${role}%`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function findApplicationsByRole(
  role: string,
  userId: string,
  db?: Db
) {
  const supabase = await resolveDb(db);

  return supabase
    .from("applications")
    .select()
    .ilike("role", `%${role}%`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function findApplicationsByCompanySlug(
  slug: string,
  userId: string,
  db?: Db
) {
  const supabase = await resolveDb(db);

  return supabase
    .from("applications")
    .select()
    .ilike("company", `%${slug}%`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function insertApplication(
  application: Omit<Application, "id" | "created_at" | "updated_at">,
  db?: Db
) {
  const supabase = await resolveDb(db);

  return supabase.from("applications").insert(application).select().single();
}

export async function deleteApplication(id: string, userId: string) {
  const supabase = await createClient();

  return supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}
