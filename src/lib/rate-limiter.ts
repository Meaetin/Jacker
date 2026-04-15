/**
 * In-memory sliding-window rate limiter + concurrent request guard.
 * Works for single-instance deployments (dev + single-server prod).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
const activeRequests = new Set<string>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

/** Prune timestamps older than the window to keep memory bounded. */
function pruneEntry(entry: RateLimitEntry, now: number) {
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
}

/**
 * Check and record a request for the given key (user ID).
 * Returns { allowed: true } or { allowed: false, retryAfterMs: number }.
 */
export function checkRateLimit(userId: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  let entry = store.get(userId);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(userId, entry);
  }

  pruneEntry(entry, now);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

/**
 * Acquire an exclusive "active request" slot for this user.
 * Returns false if the user already has a request in flight.
 */
export function acquireSlot(userId: string): boolean {
  if (activeRequests.has(userId)) return false;
  activeRequests.add(userId);
  return true;
}

/** Release the slot when the request finishes. */
export function releaseSlot(userId: string) {
  activeRequests.delete(userId);
}
