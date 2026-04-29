import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { setPassword } from "@/lib/admin-config";

export async function POST(req: NextRequest) {
  // Verify authenticated session
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = await verifyToken(token);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newPassword, confirmPassword } = await req.json();

  if (!newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "New password is required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  try {
    // setPassword re-hashes with scrypt (N=16384) + fresh random salt and saves to Redis
    await setPassword(username, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
