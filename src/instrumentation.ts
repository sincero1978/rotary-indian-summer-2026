// Runs once on server startup — auto-seeds admin credentials if none exist.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

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
      console.log("[admin] No credentials found — seeding defaults…");
      const { setAdminCredentials } = await import("@/lib/admin-config");
      await setAdminCredentials("sincero", "49%$Kick");
      console.log("[admin] Credentials seeded for user 'sincero'.");
    }
  } catch (err) {
    console.error("[admin] Instrumentation error:", err);
  }
}
