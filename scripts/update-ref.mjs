// One-time script: update a registration's reference in Redis.
// Usage: node scripts/update-ref.mjs
// Requires REDIS_URL in .env.local (run `vercel env pull .env.local` first).

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "redis";

// Load .env.local
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  const env = readFileSync(join(root, ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = val;
  }
} catch {
  console.error("Could not read .env.local — run: vercel env pull .env.local");
  process.exit(1);
}

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL not found in .env.local");
  process.exit(1);
}

// ── config ────────────────────────────────────────────────────────────────────
const DRIVER_NAME   = "Al Schuh";
const OLD_REFERENCE = "RIST-2026-USZF2M";
const NEW_REFERENCE = "RIST-2026-XYFF35";
const REDIS_KEY     = "rist:registrations";
// ─────────────────────────────────────────────────────────────────────────────

const client = createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.error("[redis]", err));
await client.connect();

const raw = await client.get(REDIS_KEY);
if (!raw) {
  console.error(`Key "${REDIS_KEY}" not found in Redis.`);
  await client.disconnect();
  process.exit(1);
}

const all = JSON.parse(raw);
const idx = all.findIndex(
  (r) => r.driverName === DRIVER_NAME && r.reference === OLD_REFERENCE
);

if (idx === -1) {
  console.error(`Entry not found: driver="${DRIVER_NAME}" reference="${OLD_REFERENCE}"`);
  console.log("\nAll entries:");
  all.forEach((r) => console.log(` • ${r.driverName} → ${r.reference}`));
  await client.disconnect();
  process.exit(1);
}

all[idx].reference = NEW_REFERENCE;
await client.set(REDIS_KEY, JSON.stringify(all));
await client.disconnect();

console.log(`✓ Updated: ${DRIVER_NAME} → ${NEW_REFERENCE}`);
