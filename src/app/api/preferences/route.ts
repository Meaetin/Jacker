import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { upsertKanbanColumnOrder } from "@/lib/db/user-preferences";
import { reconcileColumnOrder } from "@/lib/kanban/column-order";
import { kanbanColumnOrderSchema } from "@/types/schemas";
import { isDemoUser } from "@/utils/demo";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoUser(user.email)) {
    return NextResponse.json(
      { error: "Preferences are not saved for demo accounts" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = kanbanColumnOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Normalize before persisting so a malformed/partial client array can never
  // store a board state that drops or duplicates a column.
  const order = reconcileColumnOrder(parsed.data.kanbanColumnOrder);

  const { data, error } = await upsertKanbanColumnOrder(user.id, order);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ kanbanColumnOrder: data.kanban_column_order });
}
