import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { verifyAdminCredentials } from "@/lib/admin-config";

// ─── Brute-force rate limiter ─────────────────────────────────────────────────
// In-memory per-IP sliding window: max 10 attempts per 15 minutes.
// Resets on successful login. Works within a single serverless invocation;
// on Vercel each instance has its own counter — sufficient deterrent for
// low-traffic portals. Replace with Redis-backed limiter if needed.

const WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function resetLimit(ip: string): void {
  attempts.delete(ip);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
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

    resetLimit(ip);
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
