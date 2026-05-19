/**
 * In-memory IP-based rate limiter for Next.js route handlers.
 *
 * NOTE: This is a *pragmatic* limiter. Vercel serverless functions are stateless
 * across cold starts and may run multiple isolates per region, so this only
 * partially mitigates abuse. It is meaningfully better than nothing — a single
 * attacker hammering one warm lambda will get throttled — but a determined
 * attacker can sidestep it.
 *
 * Follow-up: swap the store for Vercel KV / Upstash Redis (see comments below)
 * once that is provisioned for the project.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Cap memory in case of unbounded IP variation (defensive).
const MAX_BUCKETS = 5000;

function sweep(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
  // If still huge, drop arbitrary entries (LRU-ish via insertion order).
  if (buckets.size > MAX_BUCKETS) {
    const drop = buckets.size - MAX_BUCKETS;
    let i = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++i >= drop) break;
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

export type RateLimitOptions = {
  /** Bucket id, e.g. "chat:send" — keeps per-endpoint counters separate. */
  key: string;
  /** Stable identifier for the requester (typically the client IP). */
  identifier: string;
  /** Window size in ms. */
  windowMs: number;
  /** Max number of requests allowed in the window. */
  max: number;
};

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${opts.key}:${opts.identifier}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    sweep(now);
    return {
      ok: true,
      remaining: Math.max(0, opts.max - 1),
      retryAfterSeconds: Math.ceil(opts.windowMs / 1000),
      resetAt,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.max - existing.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    ok: existing.count <= opts.max,
    remaining,
    retryAfterSeconds,
    resetAt: existing.resetAt,
  };
}

/**
 * Best-effort client IP extraction from common proxy headers.
 * Vercel sets `x-forwarded-for` and `x-real-ip`.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * Build a 429 Response with Retry-After + RateLimit-* headers.
 */
export function tooManyRequests(result: RateLimitResult, max: number): Response {
  return new Response(
    JSON.stringify({
      error: "For mange forespørsler. Prøv igjen om litt.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "RateLimit-Limit": String(max),
        "RateLimit-Remaining": String(result.remaining),
        "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
