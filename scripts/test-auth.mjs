import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "redis";
import { scrypt, timingSafeEqual } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(join(root, ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
}

const c = createClient({ url: process.env.REDIS_URL });
c.on("error", (e) => console.error("[redis]", e));
await c.connect();
const raw = await c.get("rist:admin:users");
await c.disconnect();

const users = JSON.parse(raw ?? "{}");

async function verify(username, password) {
  const cred = users[username];
  if (!cred) { console.log(`✗ User "${username}" not found`); return; }

  console.log(`\nTesting ${username}:`);
  console.log(`  hash (${cred.passwordHash.length} chars): ${cred.passwordHash.slice(0,16)}…`);
  console.log(`  salt (${cred.salt.length} chars): ${cred.salt.slice(0,16)}…`);

  const derived = await new Promise((res, rej) =>
    scrypt(password, cred.salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => e ? rej(e) : res(k))
  );
  const stored = Buffer.from(cred.passwordHash, "hex");

  console.log(`  derived length: ${derived.length} bytes`);
  console.log(`  stored  length: ${stored.length} bytes`);

  if (derived.length !== stored.length) {
    console.log(`  ✗ Length mismatch — hash is corrupted`);
    return;
  }
  const match = timingSafeEqual(derived, stored);
  console.log(`  ${match ? "✓ Password VALID" : "✗ Password INVALID"}`);
}

await verify("marc", "Marc%$123");
await verify("sincero", "49%$Kick");
