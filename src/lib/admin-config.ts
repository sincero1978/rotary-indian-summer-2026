import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "admin.json");
const TOKENS_FILE = path.join(DATA_DIR, "reset-tokens.json");

interface AdminConfig {
  password?: string;
}

interface ResetToken {
  token: string;
  expiry: number; // unix ms
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readConfig(): Promise<AdminConfig> {
  await ensureDir();
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function getPassword(): Promise<string> {
  const cfg = await readConfig();
  return cfg.password ?? (process.env.ADMIN_PASSWORD ?? "49%$Kick");
}

export async function setPassword(newPassword: string): Promise<void> {
  await ensureDir();
  const cfg = await readConfig();
  cfg.password = newPassword;
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

// ─── Reset tokens ─────────────────────────────────────────────────────────────

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readTokens(): Promise<ResetToken[]> {
  await ensureDir();
  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8");
    const all: ResetToken[] = JSON.parse(data);
    // purge expired
    return all.filter((t) => t.expiry > Date.now());
  } catch {
    return [];
  }
}

export async function createResetToken(): Promise<string> {
  const token = generateToken();
  const tokens = await readTokens();
  tokens.push({ token, expiry: Date.now() + 60 * 60 * 1000 }); // 1 h
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
  return token;
}

export async function consumeResetToken(token: string): Promise<boolean> {
  const tokens = await readTokens();
  const idx = tokens.findIndex((t) => t.token === token && t.expiry > Date.now());
  if (idx === -1) return false;
  tokens.splice(idx, 1);
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
  return true;
}
