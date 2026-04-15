import { createClient } from "@/utils/supabase/server";
import type { Application, ApplicationWithSource, ApplicationStatus } from "@/types/application";
import { normalizeCompany } from "@/utils/normalize-company";

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
  const { status, company, search, page = 1, limit = 50 } = filters;

  let query = supabase
    .from("applications")
    .select("*, raw_emails!source_email_id(subject, snippet, from_email)", { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
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

export async function getApplicationById(
  id: string,
  userId: string
): Promise<ApplicationWithSource | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*, raw_emails!source_email_id(subject, snippet, from_email, gmail_message_id)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const email = data.raw_emails as unknown as {
    subject: string | null;
    snippet: string | null;
    from_email: string | null;
    gmail_message_id: string | null;
  } | null;

  return {
    ...(data as Application),
    email_subject: email?.subject ?? null,
    email_snippet: email?.snippet ?? null,
    email_from: email?.from_email ?? null,
    gmail_message_id: email?.gmail_message_id ?? null,
  };
}

export async function updateApplication(
  id: string,
  userId: string,
  fields: Record<string, unknown>
) {
  const supabase = await createClient();

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
  userId: string
) {
  const supabase = await createClient();

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
  userId: string
) {
  const supabase = await createClient();

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

export async function findApplicationsByRole(role: string, userId: string) {
  const supabase = await createClient();

  return supabase
    .from("applications")
    .select()
    .ilike("role", `%${role}%`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function findApplicationsByCompanySlug(
  slug: string,
  userId: string
) {
  const supabase = await createClient();

  return supabase
    .from("applications")
    .select()
    .ilike("company", `%${slug}%`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function insertApplication(
  application: Omit<Application, "id" | "created_at" | "updated_at">
) {
  const supabase = await createClient();

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
