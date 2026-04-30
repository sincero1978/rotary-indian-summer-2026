import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { readAll } from "@/lib/store";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  console.log("[admin/page] render start");

  // ── 1. Cookie ─────────────────────────────────────────────────────────────
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  console.log("[admin/page] token present:", !!token);
  if (!token) redirect("/admin/login");

  // ── 2. Verify token ───────────────────────────────────────────────────────
  // verifyToken() has its own internal try-catch and returns null on any error.
  const username = await verifyToken(token);
  console.log("[admin/page] username:", username ?? "(null — invalid/expired)");
  if (!username) redirect("/admin/login");

  // ── 3. Load registrations ─────────────────────────────────────────────────
  // readAll() has internal try-catch; returns [] on any Redis failure.
  // The outer catch here is a last-resort safety net.
  let registrations: Awaited<ReturnType<typeof readAll>> = [];
  try {
    console.log("[admin/page] calling readAll…");
    registrations = await readAll();
    console.log(`[admin/page] readAll returned ${registrations.length} registrations`);
  } catch (err) {
    console.error("[admin/page] readAll threw unexpectedly (rendering with []):", err);
  }

  // ── 4. Render ─────────────────────────────────────────────────────────────
  console.log("[admin/page] rendering AdminDashboard for:", username);
  return <AdminDashboard initialRegistrations={registrations} username={username} />;
}
