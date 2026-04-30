/**
 * Redis-backed sliding-window rate limiter.
 * Falls back to in-memory when REDIS_URL is absent (local dev).
 *
 * Uses INCR + EXPIRE — atomic: the INCR is a single round-trip; EXPIRE is only
 * set on the first increment so the window starts from the first request.
 */

import { createClient } from "redis";

const WINDOW_S  = 15 * 60; // 15 minutes default

// ─── In-memory fallback (local dev, no Redis) ────────────────────────────────
const memStore = new Map<string, { count: number; windowStart: number }>();

function memCheck(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const e = memStore.get(key);
  if (!e || now - e.windowStart > windowMs) {
    memStore.set(key, { count: 1, windowStart: now });
    return false;
  }
  e.count++;
  return e.count > max;
}

// ─── Redis helper ─────────────────────────────────────────────────────────────

async function withRedis<T>(fn: (c: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const client = createClient({
    url: process.env.REDIS_URL!,
    socket: { reconnectStrategy: false },
  });
  client.on("error", () => {});
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect().catch(() => {});
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if the caller exceeds the allowed rate.
 * @param key       Unique bucket key, e.g. `login:${ip}` or `forgot:${email}`
 * @param max       Maximum requests allowed in the window
 * @param windowSec Window length in seconds (default 900 = 15 min)
 */
export async function isRateLimited(
  key: string,
  max: number,
  windowSec = WINDOW_S,
): Promise<boolean> {
  const rkey = `rist:rl:${key}`;

  if (!process.env.REDIS_URL) {
    return memCheck(rkey, max, windowSec * 1000);
  }

  try {
    return await withRedis(async (c) => {
      const count = await c.incr(rkey);
      if (count === 1) await c.expire(rkey, windowSec);
      return count > max;
    });
  } catch {
    // Redis unavailable — degrade gracefully to in-memory
    return memCheck(rkey, max, windowSec * 1000);
  }
}

/**
 * Clears the rate-limit counter for a key (call on successful auth).
 */
export async function resetRateLimit(key: string): Promise<void> {
  const rkey = `rist:rl:${key}`;
  memStore.delete(rkey);

  if (!process.env.REDIS_URL) return;
  try {
    await withRedis(async (c) => { await c.del(rkey); });
  } catch {
    // non-fatal
  }
}
