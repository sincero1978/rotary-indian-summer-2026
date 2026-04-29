// Runs once on server startup.
// On Vercel: credentials come from env vars — nothing to seed.
// On local dev: seeds data/admin.json if it doesn't exist yet.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // If env vars are set (Vercel), credentials are already available — skip.
  if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_SALT) return;

  try {
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const configFile = path.join(process.cwd(), "data", "admin.json");

    let hasCredential = false;
    try {
      const raw = await fs.readFile(configFile, "utf-8");
      hasCredential = !!JSON.parse(raw)?.credential?.passwordHash;
    } catch {
      hasCredential = false;
    }

    if (!hasCredential) {
      console.log("[admin] No credentials found — seeding defaults for local dev…");
      const { setAdminCredentials } = await import("@/lib/admin-config");
      await setAdminCredentials("sincero", "49%$Kick");
      console.log("[admin] Local credentials seeded for user 'sincero'.");
    }
  } catch (err) {
    console.error("[admin] Instrumentation error:", err);
  }
}
