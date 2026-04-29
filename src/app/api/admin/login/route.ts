import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { verifyAdminCredentials } from "@/lib/admin-config";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!(await verifyAdminCredentials(username ?? "", password ?? ""))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = await createToken(username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[admin/login] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
