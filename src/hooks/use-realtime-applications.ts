"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient, realtimeReady } from "@/utils/supabase/client";
import type { Application } from "@/types/application";

interface RealtimeApplicationHandlers {
  onUpsert: (row: Application) => void;
  onDelete: (id: string) => void;
}

/**
 * Subscribes to the current user's `applications` row changes and streams
 * INSERT/UPDATE into onUpsert and DELETE into onDelete. Handlers should be
 * stable (memoized) to avoid resubscribing on every render.
 */
export function useRealtimeApplications(
  userId: string,
  { onUpsert, onDelete }: RealtimeApplicationHandlers
) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const filter = `user_id=eq.${userId}`;

    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    // Join only once the socket carries the user's token — see realtimeReady.
    void realtimeReady().then(() => {
      if (cancelled) return;

      channel = supabase
        .channel(`applications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "applications", filter },
          (payload) => onUpsert(payload.new as Application)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "applications", filter },
          (payload) => onUpsert(payload.new as Application)
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "applications", filter },
          (payload) => {
            const old = payload.old as { id?: string };
            if (old.id) onDelete(old.id);
          }
        )
        .subscribe((status, error) => {
          // Without this a failed join is completely silent: no events arrive
          // and nothing says why.
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`[realtime] applications channel ${status}`, error);
          }
        });
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, onUpsert, onDelete]);
}
