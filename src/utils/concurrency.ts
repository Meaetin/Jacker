/**
 * Runs `fn` over `items` with at most `limit` in flight at once.
 *
 * Results come back in input order regardless of completion order, so callers
 * that depend on ordering (the ingest pipeline walks emails oldest-first) stay
 * correct. A rejection does not abandon the remaining work: every item is still
 * attempted, and the first error is rethrown once the pool drains.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const width = Math.max(1, Math.min(limit, items.length));
  const results = new Array<R>(items.length);
  const errors: unknown[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;

      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        errors.push(error);
      }
    }
  }

  await Promise.all(Array.from({ length: width }, () => worker()));

  if (errors.length > 0) throw errors[0];
  return results;
}
