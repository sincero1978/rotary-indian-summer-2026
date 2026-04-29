import { promises as fs } from "fs";
import path from "path";
import { createClient } from "redis";
import type { StoredRegistration } from "./admin-types";

export type { StoredRegistration };

// ─── Redis store (Vercel / production) ───────────────────────────────────────
// Uses REDIS_URL env var set by the Vercel Redis integration.
// Falls back to local file storage when REDIS_URL is absent (local dev).

const REDIS_KEY = "rist:registrations";

function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("[redis]", err));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect().catch(() => {});
  }
}

async function redisReadAll(): Promise<StoredRegistration[]> {
  // BUG FIX: was missing await — errors were silently uncaught
  return await withRedis(async (client) => {
    const raw = await client.get(REDIS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredRegistration[];
  });
}

async function redisAppendOne(reg: StoredRegistration): Promise<void> {
  return withRedis(async (client) => {
    const raw = await client.get(REDIS_KEY);
    const all: StoredRegistration[] = raw ? JSON.parse(raw) : [];
    all.push(reg);
    await client.set(REDIS_KEY, JSON.stringify(all));
  });
}

async function redisRemoveOne(id: string): Promise<void> {
  return withRedis(async (client) => {
    const raw = await client.get(REDIS_KEY);
    const all: StoredRegistration[] = raw ? JSON.parse(raw) : [];
    await client.set(REDIS_KEY, JSON.stringify(all.filter((r) => r.id !== id)));
  });
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
  try {
    await fs.mkdir(getDataDir(), { recursive: true });
  } catch {
    // Already exists or read-only — fine for reads
  }
}

async function fileReadAll(): Promise<StoredRegistration[]> {
  try {
    await ensureDir();
    const data = await fs.readFile(getFile(), "utf-8");
    return JSON.parse(data) as StoredRegistration[];
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
    console.error("[store] appendOne failed:", err);
  }
}

async function fileRemoveOne(id: string): Promise<void> {
  try {
    await ensureDir();
    const all = await fileReadAll();
    await fs.writeFile(
      getFile(),
      JSON.stringify(all.filter((r) => r.id !== id), null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("[store] removeOne failed:", err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readAll(): Promise<StoredRegistration[]> {
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
