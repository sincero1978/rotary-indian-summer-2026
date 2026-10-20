import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isTokenRevoked } from "@/lib/admin-config";
import { addRally, readRallies } from "@/lib/rallies";

export const runtime = "nodejs";

async function authenticated(): Promise<boolean> {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return !(await isTokenRevoked(token));
}

export async function GET() {
  if (!(await authenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readRallies());
}

export async function POST(request: NextRequest) {
  if (!(await authenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
  const date = typeof body.date === "string" ? body.date : "";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !location) {
    return NextResponse.json({ error: "Title, valid date, and location are required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await addRally({ title, date, location, description }), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create rally";
    return NextResponse.json({ error: message }, { status: message.includes("already exists") ? 409 : 500 });
  }
}
