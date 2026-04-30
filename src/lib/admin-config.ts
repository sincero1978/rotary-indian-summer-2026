import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { createClient } from "redis";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCredential {
  username: string;
  passwordHash: string; // hex-encoded scrypt output (64 bytes)
  salt: string;         // hex-encoded random salt (32 bytes)
}

type AdminUsers = Record<string, AdminCredential>;

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

// ─── Redis user storage ───────────────────────────────────────────────────────
// Stores all admin users as { [username]: AdminCredential } under one key.
// Migrates automatically from the legacy single-credential key on first read.

const ADMIN_USERS_KEY  = "rist:admin:users";
const LEGACY_CRED_KEY  = "rist:admin:credentials"; // pre-multi-user key

function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.REDIS_URL!;
  const client = createClient({
    url,
    socket: { reconnectStrategy: false, connectTimeout: 5000 },
  });
  client.on("error", (err) => console.error("[admin-config] Redis client error:", err));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.disconnect().catch(() => {});
  }
}

async function redisGetUsers(): Promise<AdminUsers> {
  try {
    // BUG FIX: was missing await — try/catch never caught connection errors
    return await withRedis(async (client) => {
      const raw = await client.get(ADMIN_USERS_KEY);
      if (raw) return JSON.parse(raw) as AdminUsers;

      // One-time migration from legacy single-credential key
      const legacyRaw = await client.get(LEGACY_CRED_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as AdminCredential;
        if (legacy?.username && legacy?.passwordHash) {
          const users: AdminUsers = { [legacy.username]: legacy };
          await client.set(ADMIN_USERS_KEY, JSON.stringify(users));
          return users;
        }
      }

      return {};
    });
  } catch (err) {
    console.error("[admin-config] redisGetUsers failed:", err);
    return {};
  }
}

async function redisSaveUsers(users: AdminUsers): Promise<void> {
  await withRedis(async (client) => {
    await client.set(ADMIN_USERS_KEY, JSON.stringify(users));
  });
}

// ─── File credential storage (local dev fallback) ────────────────────────────

function getAdminDataDir(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return "/tmp/rist-data";
  return require("path").join(process.cwd(), "data");
}

async function fileGetCredential(username?: string): Promise<AdminCredential | null> {
  try {
    const { promises: fs } = await import("fs");
    const file = require("path").join(getAdminDataDir(), "admin.json");
    const raw = await fs.readFile(file, "utf-8");
    const cfg = JSON.parse(raw);
    const cred = cfg?.credential as AdminCredential | undefined;
    if (!cred?.passwordHash) return null;
    if (username && cred.username !== username) return null;
    return cred;
  } catch {
    return null;
  }
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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  // 1. Redis users map (primary)
  if (isRedisAvailable()) {
    const users = await redisGetUsers();
    const cred = users[username];
    if (cred) return verifyHash(password, cred.passwordHash, cred.salt);
    // No entry in Redis for this user — fall through to env vars / file
  }

  // 2. Env vars (initial Vercel deploy, single admin, before any password change)
  const envUser = process.env.ADMIN_USERNAME;
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  const envSalt = process.env.ADMIN_PASSWORD_SALT;
  if (envUser && envHash && envSalt && envUser === username) {
    return verifyHash(password, envHash, envSalt);
  }

  // 3. File (local dev)
  const fileCred = await fileGetCredential(username);
  if (fileCred) return verifyHash(password, fileCred.passwordHash, fileCred.salt);

  console.error(`[admin] No credentials found for user "${username}".`);
  return false;
}

/** Create or update a user's password. Scrypt-hashes with a fresh random salt. */
export async function setAdminCredentials(
  username: string,
  password: string
): Promise<void> {
  const { hash, salt } = await hashPassword(password);
  const cred: AdminCredential = { username, passwordHash: hash, salt };

  if (isRedisAvailable()) {
    const users = await redisGetUsers();
    users[username] = cred;
    await redisSaveUsers(users);
  } else {
    await fileSaveCredential(cred);
  }
}

/** Change the password for an existing user (keeps username). */
export async function setPassword(username: string, newPassword: string): Promise<void> {
  await setAdminCredentials(username, newPassword);
}

// ─── Session token revocation ─────────────────────────────────────────────────
// On logout we store a SHA-256 fingerprint of the token in Redis with a TTL
// equal to the token's remaining lifetime. verifyToken checks this blocklist.

const BLOCKLIST_PREFIX = "rist:auth:blocked:";

function tokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function revokeToken(token: string): Promise<void> {
  if (!isRedisAvailable()) return;
  const fp = tokenFingerprint(token);
  try {
    await withRedis(async (c) => {
      // TTL = 8h (max session lifetime). Any residual time is safe to over-estimate.
      await c.set(`${BLOCKLIST_PREFIX}${fp}`, "1", { EX: 8 * 60 * 60 });
    });
  } catch (err) {
    console.error("[admin-config] revokeToken failed:", err);
  }
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  const fp = tokenFingerprint(token);
  try {
    return await withRedis(async (c) => {
      return (await c.get(`${BLOCKLIST_PREFIX}${fp}`)) !== null;
    });
  } catch {
    return false; // fail open — better than locking out all admins on Redis hiccup
  }
}

// ─── Reset tokens (HMAC-signed, single-use via Redis) ─────────────────────────

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
    if (data.exp <= Date.now()) return false;

    // Enforce single-use: store a fingerprint in Redis with TTL = remaining lifetime.
    // SETNX (NX option) atomically rejects if already used.
    const fp = createHash("sha256").update(token).digest("hex");
    const usedKey = `rist:reset:used:${fp}`;
    const ttl = Math.ceil((data.exp - Date.now()) / 1000);

    if (isRedisAvailable()) {
      try {
        const stored = await withRedis(async (c) => {
          // SET key 1 NX EX ttl — returns "OK" if set, null if already exists
          return c.set(usedKey, "1", { NX: true, EX: ttl });
        });
        if (stored === null) {
          // Token was already used
          console.warn("[admin-config] Reset token replay attempt detected.");
          return false;
        }
      } catch (err) {
        // Redis unavailable — allow the reset but log a warning
        console.warn("[admin-config] Could not enforce single-use token (Redis unavailable):", err);
      }
    }

    return true;
  } catch {
    return false;
  }
}
