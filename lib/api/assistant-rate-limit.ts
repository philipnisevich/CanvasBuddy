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

/** Reset the window if it has expired. Does not increment the counter. */
function rollWindow(state: WindowState, windowMs: number, now: number) {
  if (now - state.windowStart >= windowMs) {
    state.windowStart = now;
    state.count = 0;
  }
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

  rollWindow(entry.minute, MINUTE_MS, now);
  rollWindow(entry.hour, HOUR_MS, now);

  const minuteResetAt = entry.minute.windowStart + MINUTE_MS;
  const hourResetAt = entry.hour.windowStart + HOUR_MS;

  // Check both windows before committing so a rejected request does not
  // consume quota in either window.
  if (entry.minute.count >= MINUTE_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((minuteResetAt - now) / 1000));
    return {
      allowed: false,
      limit: MINUTE_MAX,
      remaining: 0,
      resetAt: minuteResetAt,
      retryAfterSec,
    };
  }

  if (entry.hour.count >= HOUR_MAX) {
    const retryAfterSec = Math.max(1, Math.ceil((hourResetAt - now) / 1000));
    return {
      allowed: false,
      limit: HOUR_MAX,
      remaining: 0,
      resetAt: hourResetAt,
      retryAfterSec,
    };
  }

  entry.minute.count += 1;
  entry.hour.count += 1;

  return {
    allowed: true,
    limit: MINUTE_MAX,
    remaining: Math.min(
      MINUTE_MAX - entry.minute.count,
      HOUR_MAX - entry.hour.count
    ),
    resetAt: Math.min(minuteResetAt, hourResetAt),
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
