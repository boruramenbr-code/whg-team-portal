/**
 * In-memory rate limiter for Vercel serverless functions.
 *
 * This uses a sliding-window approach stored in a module-level Map.
 * On Vercel, each serverless instance keeps its own Map, so this
 * provides per-instance protection — limits reset on cold starts.
 * For a small-to-medium app like WHG Team Portal this is more than
 * sufficient. The main goal is preventing runaway OpenAI costs from
 * a single abusive session, not global enforcement.
 *
 * To upgrade to cross-instance rate limiting later:
 *   1. Add Upstash Redis (free tier covers this volume)
 *   2. Replace the Map reads/writes with Redis INCR + EXPIRE
 *   3. Keep the same checkRateLimit() interface — callers don't change
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  });
}, 60_000);

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxAttempts: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const existing = store.get(key);

  // No existing entry or window has expired — allow and start new window
  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterSeconds: 0 };
  }

  // Within window — check count
  if (existing.count >= config.maxAttempts) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Within window, still has attempts
  existing.count += 1;
  return {
    allowed: true,
    remaining: config.maxAttempts - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract a usable identifier from the request for rate limiting.
 * Uses X-Forwarded-For (set by Vercel) or falls back to a generic key.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown-client';
}
