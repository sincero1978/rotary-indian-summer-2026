import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "registrations.json");

export interface StoredRegistration {
  id: string;
  reference: string;
  submittedAt: string;
  driverName: string;
  copilotName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  extraParticipants: number;
  extraNames: string[];
  mealChoices: Array<{ include: boolean; menu: string }>;
  mealCost: number;
  total: number;
  lang: string;
}

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
