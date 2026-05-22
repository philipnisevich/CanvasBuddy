/**
 * In-memory sliding-window rate limits for /api/assistant.
 * Resets on server restart; sufficient for single-instance / dev. For multi-instance
 * production, replace with Redis/Upstash.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
}

interface WindowState {
  count: number;
  windowStart: number;
}

const stores = new Map<string, { minute: WindowState; hour: WindowState }>();

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const MINUTE_MAX = envInt("ASSISTANT_RATE_LIMIT_PER_MINUTE", 6);
const HOUR_MAX = envInt("ASSISTANT_RATE_LIMIT_PER_HOUR", 40);
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

function pruneStale(now: number) {
  if (stores.size < 500) return;
  for (const [key, entry] of stores) {
    if (
      now - entry.minute.windowStart > MINUTE_MS * 2 &&
      now - entry.hour.windowStart > HOUR_MS * 2
    ) {
      stores.delete(key);
    }
  }
}

function bumpWindow(
  state: WindowState,
  windowMs: number,
  max: number,
  now: number
): { allowed: boolean; remaining: number; resetAt: number } {
  if (now - state.windowStart >= windowMs) {
    state.windowStart = now;
    state.count = 0;
  }
  state.count += 1;
  const remaining = Math.max(0, max - state.count);
  const resetAt = state.windowStart + windowMs;
  return {
    allowed: state.count <= max,
    remaining,
    resetAt,
  };
}

export function checkAssistantRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  pruneStale(now);

  let entry = stores.get(key);
  if (!entry) {
    entry = {
      minute: { count: 0, windowStart: now },
      hour: { count: 0, windowStart: now },
    };
    stores.set(key, entry);
  }

  const minute = bumpWindow(entry.minute, MINUTE_MS, MINUTE_MAX, now);
  const hour = bumpWindow(entry.hour, HOUR_MS, HOUR_MAX, now);

  if (!minute.allowed) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((minute.resetAt - now) / 1000)
    );
    return {
      allowed: false,
      limit: MINUTE_MAX,
      remaining: 0,
      resetAt: minute.resetAt,
      retryAfterSec,
    };
  }

  if (!hour.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((hour.resetAt - now) / 1000));
    return {
      allowed: false,
      limit: HOUR_MAX,
      remaining: 0,
      resetAt: hour.resetAt,
      retryAfterSec,
    };
  }

  return {
    allowed: true,
    limit: MINUTE_MAX,
    remaining: Math.min(minute.remaining, hour.remaining),
    resetAt: Math.min(minute.resetAt, hour.resetAt),
  };
}

export function rateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
