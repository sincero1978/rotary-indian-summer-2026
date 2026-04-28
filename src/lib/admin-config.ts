import { promises as fs } from "fs";
import path from "path";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "admin.json");
const TOKENS_FILE = path.join(DATA_DIR, "reset-tokens.json");

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCredential {
  username: string;       // stored in plain (not secret)
  passwordHash: string;   // hex-encoded scrypt output (64 bytes)
  salt: string;           // hex-encoded random salt (32 bytes)
}

interface AdminConfig {
  credential?: AdminCredential;
}

interface ResetToken {
  token: string;
  expiry: number; // unix ms
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readConfig(): Promise<AdminConfig> {
  await ensureDir();
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data) as AdminConfig;
  } catch {
    return {};
  }
}

async function writeConfig(cfg: AdminConfig): Promise<void> {
  await ensureDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

// ─── Password hashing (scrypt, Node.js built-in) ──────────────────────────────
// Parameters: N=16384, r=8, p=1 — OWASP-recommended minimum

function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keylen, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(32).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return { hash: derived.toString("hex"), salt };
}

async function verifyHash(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  try {
    const derived = await scryptAsync(password, salt, 64);
    const storedBuf = Buffer.from(storedHash, "hex");
    if (derived.length !== storedBuf.length) return false;
    return timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

// ─── Credential management ────────────────────────────────────────────────────

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const cfg = await readConfig();
  if (!cfg.credential) return false;
  if (cfg.credential.username !== username) return false;
  return verifyHash(password, cfg.credential.passwordHash, cfg.credential.salt);
}

export async function setAdminCredentials(
  username: string,
  password: string
): Promise<void> {
  const { hash, salt } = await hashPassword(password);
  const cfg = await readConfig();
  cfg.credential = { username, passwordHash: hash, salt };
  await writeConfig(cfg);
}

/** Only changes password, keeps username */
export async function setPassword(newPassword: string): Promise<void> {
  const cfg = await readConfig();
  const username = cfg.credential?.username ?? "sincero";
  await setAdminCredentials(username, newPassword);
}

// ─── Reset tokens ─────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function readTokens(): Promise<ResetToken[]> {
  await ensureDir();
  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8");
    const all: ResetToken[] = JSON.parse(data);
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
