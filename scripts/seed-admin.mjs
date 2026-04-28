// One-time script: hashes the initial admin credentials and writes to data/admin.json
// Run with: node scripts/seed-admin.mjs
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scryptAsync = promisify(scrypt);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const CONFIG_FILE = path.join(DATA_DIR, "admin.json");

async function hashPassword(password) {
  const salt = randomBytes(32).toString("hex");
  const derived = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return { hash: derived.toString("hex"), salt };
}

async function main() {
  const username = "sincero";
  const password = "49%$Kick";

  await fs.mkdir(DATA_DIR, { recursive: true });

  // Don't overwrite existing credentials
  try {
    const existing = JSON.parse(await fs.readFile(CONFIG_FILE, "utf-8"));
    if (existing.credential?.passwordHash) {
      console.log("✓ admin.json already has hashed credentials — skipping.");
      return;
    }
  } catch {
    // file doesn't exist yet, proceed
  }

  console.log("⏳ Hashing credentials with scrypt (this takes a moment)…");
  const { hash, salt } = await hashPassword(password);

  const config = { credential: { username, passwordHash: hash, salt } };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  console.log(`✓ Credentials seeded for user "${username}"`);
  console.log("  data/admin.json contains only the scrypt hash — the plaintext password is never stored.");
}

main().catch(console.error);
