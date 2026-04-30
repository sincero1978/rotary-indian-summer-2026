import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/admin-config";

export async function POST(req: NextRequest) {
  // Blocklist the token server-side so it cannot be replayed even if the cookie
  // is somehow recovered after logout (e.g. from a session restore or theft).
  const token = req.cookies.get("admin_token")?.value;
  if (token) {
    await revokeToken(token).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return res;
}
