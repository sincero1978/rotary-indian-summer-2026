import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { readAll } from "@/lib/store";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) redirect("/admin/login");

  const username = await verifyToken(token);
  if (!username) redirect("/admin/login");

  const registrations = await readAll();

  return <AdminDashboard initialRegistrations={registrations} username={username} />;
}
