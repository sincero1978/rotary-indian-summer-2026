import { NextRequest, NextResponse } from "next/server";
import { consumeResetToken, setPassword } from "@/lib/admin-config";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token?.trim()) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const valid = await consumeResetToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    await setPassword(password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
