import { promises as fs } from "fs";
import path from "path";
import type { StoredRegistration } from "./admin-types";

export type { StoredRegistration };

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "registrations.json");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readAll(): Promise<StoredRegistration[]> {
  await ensureDir();
  try {
    const data = await fs.readFile(FILE, "utf-8");
    return JSON.parse(data) as StoredRegistration[];
  } catch {
    return [];
  }
}

export async function appendOne(reg: StoredRegistration): Promise<void> {
  const all = await readAll();
  all.push(reg);
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), "utf-8");
}

export async function removeOne(id: string): Promise<void> {
  const all = await readAll();
  const filtered = all.filter((r) => r.id !== id);
  await fs.writeFile(FILE, JSON.stringify(filtered, null, 2), "utf-8");
}
