import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

export const runtime = "nodejs";

// Called by Vercel Cron every Monday at 08:00 UTC to keep the Redis Cloud
// free-tier database alive (deleted after 30 days of inactivity).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({ ok: false, reason: "REDIS_URL not set" });
  }

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: false, connectTimeout: 5000 },
  });

  try {
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    console.log("[keepalive] Redis PING OK:", pong, new Date().toISOString());
    return NextResponse.json({ ok: true, pong, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[keepalive] Redis PING failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
