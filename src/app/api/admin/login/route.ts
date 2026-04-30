import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { verifyAdminCredentials } from "@/lib/admin-config";
import { isRateLimited, resetRateLimit } from "@/lib/rate-limit";

// ─── Brute-force rate limiter ─────────────────────────────────────────────────
// Redis-backed: 10 attempts per IP per 15 minutes, shared across all serverless
// instances. Falls back to in-memory when Redis is unavailable (local dev).

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limitKey = `login:${ip}`;

  if (await isRateLimited(limitKey, 10, 15 * 60)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!(await verifyAdminCredentials(username, password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Successful login — clear the rate-limit counter for this IP
    await resetRateLimit(limitKey);

    const token = await createToken(username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",   // upgraded from "lax" — prevents all cross-site cookie sends
      maxAge: 8 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[admin/login] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
