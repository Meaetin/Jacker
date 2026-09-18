"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient, realtimeReady } from "@/utils/supabase/client";

export interface SyncJob {
  id: string;
  status: "running" | "done" | "error";
  total: number;
  processed: number;
  new_applications: number;
  updated_applications: number;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

// A run is capped at 300s by the serverless ceiling, so anything still claiming
// to be running past that was killed mid-flight — a crash, a redeploy, or the
// dev server being stopped — and never reached the code that marks it finished.
// 6 minutes leaves a minute of margin over the 300s ceiling.
const STALE_JOB_MS = 6 * 60 * 1000;

// How often to re-check. Without this a job only ages out on a page load, so a
// stuck spinner survives until the user thinks to refresh.
const STALE_CHECK_MS = 30 * 1000;

function isStale(job: SyncJob, now: number): boolean {
  return (
    job.status === "running" &&
    now - new Date(job.started_at).getTime() > STALE_JOB_MS
  );
}

/**
 * Tracks the user's latest sync job via the DB + Realtime. On mount it restores
 * any in-flight job (so the spinner + progress survive a refresh), then streams
 * live updates as the pipeline reports progress and finishes.
 */
export function useSyncJob(userId?: string): SyncJob | null {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Only tick while something claims to be running, and stop once it has aged
  // out — there is nothing left to watch after that.
  useEffect(() => {
    if (!job || job.status !== "running") return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (isStale(job, current)) clearInterval(timer);
    }, STALE_CHECK_MS);

    return () => clearInterval(timer);
  }, [job]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let active = true;

    // Restore an in-progress sync after a refresh.
    supabase
      .from("sync_jobs")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setJob(data as SyncJob);
      });

    const filter = `user_id=eq.${userId}`;
    let channel: RealtimeChannel | undefined;

    // Join only once the socket carries the user's token — see realtimeReady.
    void realtimeReady().then(() => {
      if (!active) return;

      channel = supabase
        .channel(`sync_jobs:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "sync_jobs", filter },
          (payload) => setJob(payload.new as SyncJob)
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "sync_jobs", filter },
          (payload) => setJob(payload.new as SyncJob)
        )
        .subscribe((status, error) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`[realtime] sync_jobs channel ${status}`, error);
          }
        });
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  // Hide a job that has aged out rather than returning it. Callers treat a
  // running job as "busy", which disables the button whose only job is to clear
  // it — reporting null breaks that deadlock and lets a new sync retire the row.
  return job && isStale(job, now) ? null : job;
}
