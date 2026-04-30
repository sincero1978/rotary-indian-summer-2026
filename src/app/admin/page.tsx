import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { readAll } from "@/lib/store";
import { isTokenRevoked } from "@/lib/admin-config";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  console.log("[admin/page] rendering — start");

  // ── 1. Cookie check ────────────────────────────────────────────────────────
  const store = await cookies().catch((err: unknown) => {
    console.error("[admin/page] cookies() threw:", err);
    return null;
  });
  if (!store) redirect("/admin/login");

  const token = store.get("admin_token")?.value;
  console.log("[admin/page] admin_token present:", !!token);
  if (!token) {
    console.log("[admin/page] no token → redirecting to login");
    redirect("/admin/login");
  }

  // ── 2. Token verification ──────────────────────────────────────────────────
  let username: string | null = null;
  try {
    username = await verifyToken(token);
    console.log("[admin/page] verifyToken result:", username ?? "null (invalid/expired)");
  } catch (err) {
    console.error("[admin/page] verifyToken threw (unexpected):", err);
  }
  if (!username) {
    console.log("[admin/page] invalid token → redirecting to login");
    redirect("/admin/login");
  }

  // ── 3. Token revocation check ──────────────────────────────────────────────
  try {
    const revoked = await isTokenRevoked(token);
    console.log("[admin/page] isTokenRevoked:", revoked);
    if (revoked) {
      console.log("[admin/page] token revoked → redirecting to login");
      redirect("/admin/login");
    }
  } catch (err) {
    // Non-fatal: if the revocation check fails (e.g. Redis down), allow access
    // rather than locking all admins out. Log prominently.
    console.error("[admin/page] isTokenRevoked check failed (non-fatal, allowing access):", err);
  }

  // ── 4. Load registrations ──────────────────────────────────────────────────
  let registrations: Awaited<ReturnType<typeof readAll>> = [];
  try {
    console.log("[admin/page] calling readAll()…");
    registrations = await readAll();
    console.log(`[admin/page] readAll() returned ${registrations.length} registrations`);
  } catch (err) {
    // readAll() itself has internal try-catch, but be defensive
    console.error("[admin/page] readAll() threw unexpectedly:", err);
    // Continue with empty array — dashboard is still usable
    registrations = [];
  }

  // ── 5. Render ──────────────────────────────────────────────────────────────
  console.log("[admin/page] rendering AdminDashboard for user:", username);
  return <AdminDashboard initialRegistrations={registrations} username={username} />;
}
