import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { createClient } from "redis";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCredential {
  username: string;
  passwordHash: string; // hex-encoded scrypt output (64 bytes)
  salt: string;         // hex-encoded random salt (32 bytes)
}

// ─── scrypt helper ────────────────────────────────────────────────────────────

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

// ─── Redis credential storage ─────────────────────────────────────────────────

const ADMIN_CRED_KEY = "rist:admin:credentials";

function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("[admin-redis]", err));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect().catch(() => {});
  }
}

async function redisGetCredential(): Promise<AdminCredential | null> {
  try {
    return withRedis(async (client) => {
      const raw = await client.get(ADMIN_CRED_KEY);
      if (!raw) return null;
      const cred = JSON.parse(raw) as AdminCredential;
      if (!cred?.passwordHash) return null;
      return cred;
    });
  } catch {
    return null;
  }
}

async function redisSaveCredential(cred: AdminCredential): Promise<void> {
  await withRedis(async (client) => {
    await client.set(ADMIN_CRED_KEY, JSON.stringify(cred));
  });
}

// ─── File credential storage (local dev fallback) ────────────────────────────

function getAdminDataDir(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return "/tmp/rist-data";
  return require("path").join(process.cwd(), "data");
}

async function fileGetCredential(): Promise<AdminCredential | null> {
  try {
    const { promises: fs } = await import("fs");
    const file = require("path").join(getAdminDataDir(), "admin.json");
    const raw = await fs.readFile(file, "utf-8");
    const cfg = JSON.parse(raw);
    if (cfg?.credential?.passwordHash) return cfg.credential as AdminCredential;
  } catch {
    // file doesn't exist yet
  }
  return null;
}

async function fileSaveCredential(cred: AdminCredential): Promise<void> {
  try {
    const { promises: fs } = await import("fs");
    const dataDir = getAdminDataDir();
    await fs.mkdir(dataDir, { recursive: true });
    const file = require("path").join(dataDir, "admin.json");
    const existing = JSON.parse(await fs.readFile(file, "utf-8").catch(() => "{}"));
    existing.credential = cred;
    await fs.writeFile(file, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.warn("[admin] Could not write admin.json:", err);
  }
}

// ─── Credential resolution ────────────────────────────────────────────────────
// Priority: Redis → env vars → file (local dev)

async function getCredential(): Promise<AdminCredential | null> {
  // 1. Redis (primary store on Vercel — also written by change-password)
  if (isRedisAvailable()) {
    const redisCred = await redisGetCredential();
    if (redisCred) return redisCred;
  }

  // 2. Environment variables (initial Vercel deploy before any password change)
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  const envSalt = process.env.ADMIN_PASSWORD_SALT;
  const envUser = process.env.ADMIN_USERNAME;
  if (envHash && envSalt && envUser) {
    return { username: envUser, passwordHash: envHash, salt: envSalt };
  }

  // 3. File (local dev only)
  return fileGetCredential();
}

async function saveCredential(cred: AdminCredential): Promise<void> {
  if (isRedisAvailable()) {
    await redisSaveCredential(cred);
  } else {
    await fileSaveCredential(cred);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const cred = await getCredential();
  if (!cred) {
    console.error("[admin] No credentials configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ADMIN_PASSWORD_SALT env vars.");
    return false;
  }
  if (cred.username !== username) return false;
  return verifyHash(password, cred.passwordHash, cred.salt);
}

export async function setAdminCredentials(
  username: string,
  password: string
): Promise<void> {
  const { hash, salt } = await hashPassword(password);
  await saveCredential({ username, passwordHash: hash, salt });
}

/** Changes password, keeps current username */
export async function setPassword(newPassword: string): Promise<void> {
  const cred = await getCredential();
  const username = cred?.username ?? process.env.ADMIN_USERNAME ?? "sincero";
  await setAdminCredentials(username, newPassword);
}

// ─── Reset tokens (HMAC-signed, no persistence needed) ───────────────────────

async function getTokenKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SECRET ?? "rotary-rist-2026-fallback-secret";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret + "-reset"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

export async function createResetToken(): Promise<string> {
  const payload = base64url(
    new TextEncoder().encode(
      JSON.stringify({ exp: Date.now() + 60 * 60 * 1000 })
    )
  );
  const key = await getTokenKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64url(sig)}`;
}

export async function consumeResetToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const key = await getTokenKey();
    const valid = await crypto.subtle.verify(
      "HMAC", key,
      fromBase64url(sig),
      new TextEncoder().encode(payload)
    );
    if (!valid) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
    return data.exp > Date.now();
  } catch {
    return false;
  }
}
