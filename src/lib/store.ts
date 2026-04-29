import { promises as fs } from "fs";
import path from "path";
import type { StoredRegistration } from "./admin-types";

export type { StoredRegistration };

// ─── Vercel KV store ──────────────────────────────────────────────────────────
// Uses @vercel/kv when KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel).
// Falls back to local file storage for development.

const KV_KEY = "rist:registrations";

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvReadAll(): Promise<StoredRegistration[]> {
  const { kv } = await import("@vercel/kv");
  return (await kv.get<StoredRegistration[]>(KV_KEY)) ?? [];
}

async function kvAppendOne(reg: StoredRegistration): Promise<void> {
  const { kv } = await import("@vercel/kv");
  const all = await kvReadAll();
  all.push(reg);
  await kv.set(KV_KEY, all);
}

async function kvRemoveOne(id: string): Promise<void> {
  const { kv } = await import("@vercel/kv");
  const all = await kvReadAll();
  await kv.set(KV_KEY, all.filter((r) => r.id !== id));
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
    // Directory may already exist or filesystem may be read-only — fine for reads
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
    const filtered = all.filter((r) => r.id !== id);
    await fs.writeFile(getFile(), JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.error("[store] removeOne failed:", err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readAll(): Promise<StoredRegistration[]> {
  if (isKvAvailable()) return kvReadAll();
  return fileReadAll();
}

export async function appendOne(reg: StoredRegistration): Promise<void> {
  if (isKvAvailable()) return kvAppendOne(reg);
  return fileAppendOne(reg);
}

export async function removeOne(id: string): Promise<void> {
  if (isKvAvailable()) return kvRemoveOne(id);
  return fileRemoveOne(id);
}
