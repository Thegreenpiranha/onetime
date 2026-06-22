import { NextResponse } from "next/server";

// In-memory sliding window rate limiter.
// Single-instance only. For multi-instance deploys, swap the Map for a shared
// store (Redis / Upstash) without changing the API of this module.

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

// Tunable per-endpoint limits. Adjust here, no other code changes needed.
export const LIMITS = {
  create: { limit: 20, windowMs: 60_000 }, // 20 per minute
  meta: { limit: 120, windowMs: 60_000 }, // 120 per minute
  consume: { limit: 60, windowMs: 60_000 }, // 60 per minute
} as const;

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetIn: number; // milliseconds until the window resets
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup if the map grows large. Keeps memory bounded without a timer.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, resetIn: windowMs };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      resetIn: bucket.resetAt - now,
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    limit,
    remaining: limit - bucket.count,
    resetIn: bucket.resetAt - now,
  };
}

// Extract the client identifier from request headers.
// In production behind a proxy/CDN, x-forwarded-for is reliable.
// Cloudflare also sets cf-connecting-ip. Local dev: no header → 'unknown' bucket.
export function getClientId(req: { headers: Headers }): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

// Build a 429 response with standard rate-limit headers.
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil(result.resetIn / 1000);
  return NextResponse.json(
    { error: "rate limit exceeded", retryAfter },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(retryAfter),
        "Retry-After": String(retryAfter),
      },
    },
  );
}
