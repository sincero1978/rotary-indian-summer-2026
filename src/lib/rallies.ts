import { promises as fs } from "fs";
import path from "path";
import { createClient } from "redis";

export interface RallyImage {
  id: string;
  url: string;
  alt: string;
  uploadedAt: string;
  storageKey?: string;
}

export interface Rally {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  createdAt: string;
  images: RallyImage[];
}

const REDIS_KEY = "rist:rallies";
const INITIAL_RALLY: Rally = {
  id: "rotary-indian-summer-tour-2026",
  title: "9th Rotary Indian Summer Rally",
  date: "2026-09-06",
  location: "Luxembourg",
  description: "The 9th Rotary Indian Summer Tour brought classic and sports car enthusiasts together for a charity rally through Luxembourg.",
  createdAt: "2026-09-06T00:00:00.000Z",
  images: [],
};

function dataFile() {
  const dir = process.env.VERCEL || process.env.VERCEL_ENV
    ? "/tmp/rist-data"
    : path.join(process.cwd(), "data");
  return path.join(dir, "rallies.json");
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const client = createClient({ url: process.env.REDIS_URL, socket: { reconnectStrategy: false, connectTimeout: 5000 } });
  client.on("error", (error) => console.error("[rallies] Redis error:", error));
  await client.connect();
  try { return await fn(client); } finally { await client.disconnect().catch(() => {}); }
}

async function readFile(): Promise<Rally[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(dataFile(), "utf8")) as Rally[];
    return parsed.length ? parsed : [INITIAL_RALLY];
  } catch {
    return [INITIAL_RALLY];
  }
}

async function writeFile(rallies: Rally[]): Promise<void> {
  await fs.mkdir(path.dirname(dataFile()), { recursive: true });
  await fs.writeFile(dataFile(), JSON.stringify(rallies, null, 2), "utf8");
}

export async function readRallies(): Promise<Rally[]> {
  if (process.env.REDIS_URL) {
    try {
      return await withRedis(async (client) => {
        const raw = await client.get(REDIS_KEY);
        if (!raw) {
          await client.set(REDIS_KEY, JSON.stringify([INITIAL_RALLY]));
          return [INITIAL_RALLY];
        }
        return JSON.parse(raw) as Rally[];
      });
    } catch (error) {
      console.error("[rallies] Failed to read Redis; using local data:", error);
    }
  }
  return readFile();
}

export async function saveRallies(rallies: Rally[]): Promise<void> {
  if (process.env.REDIS_URL) {
    await withRedis(async (client) => { await client.set(REDIS_KEY, JSON.stringify(rallies)); });
    return;
  }
  await writeFile(rallies);
}

export async function addRally(input: Omit<Rally, "id" | "createdAt" | "images">): Promise<Rally> {
  const rallies = await readRallies();
  const id = `${input.date}-${input.title}`
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  if (rallies.some((rally) => rally.id === id)) throw new Error("A rally with this title and date already exists");
  const rally: Rally = { ...input, id, createdAt: new Date().toISOString(), images: [] };
  await saveRallies([rally, ...rallies]);
  return rally;
}

export async function addRallyImage(rallyId: string, image: RallyImage): Promise<RallyImage> {
  const rallies = await readRallies();
  const index = rallies.findIndex((rally) => rally.id === rallyId);
  if (index < 0) throw new Error("Rally not found");
  rallies[index] = { ...rallies[index], images: [image, ...rallies[index].images] };
  await saveRallies(rallies);
  return image;
}

export async function removeRallyImage(rallyId: string, imageId: string): Promise<RallyImage | null> {
  const rallies = await readRallies();
  const rally = rallies.find((item) => item.id === rallyId);
  if (!rally) return null;
  const image = rally.images.find((item) => item.id === imageId);
  if (!image) return null;
  rally.images = rally.images.filter((item) => item.id !== imageId);
  await saveRallies(rallies);
  return image;
}
