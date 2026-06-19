import { createClient } from "@/utils/supabase/server";
import type { ApplicationStatus } from "@/types/application";
import { DEFAULT_COLUMN_ORDER, reconcileColumnOrder } from "@/lib/kanban/column-order";

export async function getKanbanColumnOrder(userId: string): Promise<ApplicationStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("kanban_column_order")
    .eq("user_id", userId)
    .maybeSingle();

  const stored = data?.kanban_column_order;
  if (error || !stored || stored.length === 0) return DEFAULT_COLUMN_ORDER;

  return reconcileColumnOrder(stored);
}

export async function upsertKanbanColumnOrder(userId: string, order: ApplicationStatus[]) {
  const supabase = await createClient();

  return supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        kanban_column_order: order,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("kanban_column_order")
    .single();
}
