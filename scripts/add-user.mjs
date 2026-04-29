// Adds or updates a user in the Redis admin users store.
// Usage: node scripts/add-user.mjs <username> <password>
// Requires REDIS_URL in .env.local (run `vercel env pull .env.local` first).

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "redis";
import { scrypt, randomBytes } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Load .env.local
try {
  const env = readFileSync(join(root, ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  }
} catch {
  console.error("Could not read .env.local — run: vercel env pull .env.local");
  process.exit(1);
}

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL not found in .env.local");
  process.exit(1);
}

const [,, username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: node scripts/add-user.mjs <username> <password>");
  process.exit(1);
}

// scrypt hash
function scryptAsync(pwd, salt) {
  return new Promise((resolve, reject) =>
    scrypt(pwd, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

const ADMIN_USERS_KEY = "rist:admin:users";

const client = createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.error("[redis]", err));
await client.connect();

const salt = randomBytes(32).toString("hex");
const derived = await scryptAsync(password, salt, 64);
const passwordHash = derived.toString("hex");

const raw = await client.get(ADMIN_USERS_KEY);
const users = raw ? JSON.parse(raw) : {};
const isNew = !users[username];
users[username] = { username, passwordHash, salt };
await client.set(ADMIN_USERS_KEY, JSON.stringify(users));
await client.disconnect();

console.log(`✓ User "${username}" ${isNew ? "created" : "updated"} in Redis.`);
console.log(`  Total users: ${Object.keys(users).join(", ")}`);
