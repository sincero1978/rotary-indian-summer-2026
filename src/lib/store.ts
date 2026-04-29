import { promises as fs } from "fs";
import path from "path";
import type { StoredRegistration } from "./admin-types";

export type { StoredRegistration };

// On Vercel the project root is read-only; /tmp is the only writable path.
// Locally we prefer the project data/ directory so the file survives restarts.
function getDataDir(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return "/tmp/rist-data";
  }
  return path.join(process.cwd(), "data");
}

function getFile(): string {
  return path.join(getDataDir(), "registrations.json");
}

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(getDataDir(), { recursive: true });
  } catch {
    // Directory may already exist or filesystem may be read-only — both are fine for reads
  }
}

export async function readAll(): Promise<StoredRegistration[]> {
  try {
    await ensureDir();
    const data = await fs.readFile(getFile(), "utf-8");
    return JSON.parse(data) as StoredRegistration[];
  } catch {
    return [];
  }
}

export async function appendOne(reg: StoredRegistration): Promise<void> {
  try {
    await ensureDir();
    const all = await readAll();
    all.push(reg);
    await fs.writeFile(getFile(), JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.error("[store] appendOne failed:", err);
  }
}

export async function removeOne(id: string): Promise<void> {
  try {
    await ensureDir();
    const all = await readAll();
    const filtered = all.filter((r) => r.id !== id);
    await fs.writeFile(getFile(), JSON.stringify(filtered, null, 2), "utf-8");
  } catch (err) {
    console.error("[store] removeOne failed:", err);
  }
}
