"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
// to be running after ten minutes was killed mid-flight and never reached the
// code that marks it finished. Treat it as dead rather than spinning forever.
const STALE_JOB_MS = 10 * 60 * 1000;

function isStale(job: SyncJob): boolean {
  return (
    job.status === "running" &&
    Date.now() - new Date(job.started_at).getTime() > STALE_JOB_MS
  );
}

/**
 * Tracks the user's latest sync job via the DB + Realtime. On mount it restores
 * any in-flight job (so the spinner + progress survive a refresh), then streams
 * live updates as the pipeline reports progress and finishes.
 */
export function useSyncJob(userId?: string): SyncJob | null {
  const [job, setJob] = useState<SyncJob | null>(null);

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
        if (active && data && !isStale(data as SyncJob)) setJob(data as SyncJob);
      });

    const filter = `user_id=eq.${userId}`;
    const channel = supabase
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
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return job;
}
