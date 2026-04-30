import { promises as fs } from "fs";
import path from "path";
import { createClient } from "redis";
import type { StoredRegistration } from "./admin-types";

export type { StoredRegistration };

// ─── Redis store (Vercel / production) ───────────────────────────────────────

const REDIS_KEY = "rist:registrations";

function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: false, connectTimeout: 5000 },
  });
  client.on("error", (err) => console.error("[store] Redis client error:", err));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect().catch(() => {});
  }
}

/** Ensure legacy / partially-written records don't crash callers. */
function normalise(r: StoredRegistration): StoredRegistration {
  return {
    ...r,
    extraNames:  Array.isArray(r.extraNames)  ? r.extraNames  : [],
    mealChoices: Array.isArray(r.mealChoices) ? r.mealChoices : [],
  };
}

async function redisReadAll(): Promise<StoredRegistration[]> {
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(REDIS_KEY);
      if (!raw) {
        console.log("[store] redisReadAll: key not found, returning []");
        return [];
      }
      const parsed = (JSON.parse(raw) as StoredRegistration[]).map(normalise);
      console.log(`[store] redisReadAll: loaded ${parsed.length} registrations`);
      return parsed;
    });
  } catch (err) {
    console.error("[store] redisReadAll failed — returning []:", err);
    return [];
  }
}

// Append via GET→SET with optimistic retry. We intentionally avoid EVAL/Lua
// because managed Redis providers (Upstash / Vercel KV) may disable or throttle it.
// Two concurrent appends in the same millisecond are extremely unlikely for this
// low-traffic portal; if it ever matters, a Redis List or a lock can be added.
async function redisAppendOne(reg: StoredRegistration): Promise<void> {
  try {
    await withRedis(async (client) => {
      const raw = await client.get(REDIS_KEY);
      const all: StoredRegistration[] = raw ? JSON.parse(raw) : [];
      all.push(reg);
      await client.set(REDIS_KEY, JSON.stringify(all));
      console.log(`[store] redisAppendOne: saved ${all.length} registrations (ref=${reg.reference})`);
    });
  } catch (err) {
    console.error("[store] redisAppendOne failed:", err);
    throw err; // re-throw so the API caller can return 500
  }
}

async function redisRemoveOne(id: string): Promise<void> {
  try {
    await withRedis(async (client) => {
      const raw = await client.get(REDIS_KEY);
      if (!raw) { console.warn("[store] redisRemoveOne: key not found, nothing to remove"); return; }
      const all: StoredRegistration[] = JSON.parse(raw);
      const next = all.filter((r) => r.id !== id);
      await client.set(REDIS_KEY, JSON.stringify(next));
      console.log(`[store] redisRemoveOne: removed id=${id}, ${next.length} remaining`);
    });
  } catch (err) {
    console.error("[store] redisRemoveOne failed:", err);
    throw err;
  }
}

// ─── File store (local dev fallback) ─────────────────────────────────────────

function getDataDir(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return "/tmp/rist-data";
  return path.join(process.cwd(), "data");
}

function getFile(): string {
  return path.join(getDataDir(), "registrations.json");
}

async function ensureDir(): Promise<void> {
  try { await fs.mkdir(getDataDir(), { recursive: true }); } catch { /* exists */ }
}

async function fileReadAll(): Promise<StoredRegistration[]> {
  try {
    await ensureDir();
    const data = await fs.readFile(getFile(), "utf-8");
    return (JSON.parse(data) as StoredRegistration[]).map(normalise);
  } catch {
    return [];
  }
}

async function fileAppendOne(reg: StoredRegistration): Promise<void> {
  try {
    await ensureDir();
    const all = await fileReadAll();
    all.push(reg);
    await fs.writeFile(getFile(), JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.error("[store] fileAppendOne failed:", err);
    throw err;
  }
}

async function fileRemoveOne(id: string): Promise<void> {
  try {
    await ensureDir();
    const all = await fileReadAll();
    await fs.writeFile(getFile(), JSON.stringify(all.filter((r) => r.id !== id), null, 2), "utf-8");
  } catch (err) {
    console.error("[store] fileRemoveOne failed:", err);
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readAll(): Promise<StoredRegistration[]> {
  console.log(`[store] readAll: redis=${isRedisAvailable()}`);
  if (isRedisAvailable()) return redisReadAll();
  return fileReadAll();
}

export async function appendOne(reg: StoredRegistration): Promise<void> {
  if (isRedisAvailable()) return redisAppendOne(reg);
  return fileAppendOne(reg);
}

export async function removeOne(id: string): Promise<void> {
  if (isRedisAvailable()) return redisRemoveOne(id);
  return fileRemoveOne(id);
}
