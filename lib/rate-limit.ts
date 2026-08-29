/**
 * Simple sliding-window rate limiter.
 * Works for single-instance deployments; swap the Map for a Redis client when
 * running on Vercel serverless (multiple instances share no memory).
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key   Identifier for the rate-limit bucket (e.g. IP, userId)
 * @param limit Max requests per window
 * @param windowMs Length of the sliding window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/** Returns the retry-after ms for a key that is currently over limit. */
export function getRetryAfter(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.max(0, entry.resetAt - Date.now());
}
