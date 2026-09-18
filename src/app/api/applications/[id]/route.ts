import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApplicationById, updateApplication, deleteApplication } from "@/lib/db/applications";
import { editableFieldsSchema } from "@/types/schemas";
import { isDemoUser } from "@/utils/demo";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await getApplicationById(id, user.id);
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = editableFieldsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid fields", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await updateApplication(id, user.id, {
    ...parsed.data,
    updated_at: now,
    // Ingest compares email dates to decide whether to overwrite a status. A
    // hand-edited one has no email behind it, so without a date of its own the
    // row still looks last-touched by whatever email set it — and the next
    // email of any age would silently undo the correction.
    ...(parsed.data.status !== undefined
      ? { application_updated_at: now, status_source: "manual" }
      : {}),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Deleting applications is disabled for demo accounts" },
      { status: 403 },
    );
  }

  const { error } = await deleteApplication(id, user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
