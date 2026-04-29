import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { readAll, appendOne, removeOne, StoredRegistration } from "@/lib/store";
import { randomUUID } from "crypto";

async function isAuth(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return false;
  return !!(await verifyToken(token));
}

function makeReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `RIST-2026-${suffix}`;
}

export async function GET() {
  if (!(await isAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const registrations = await readAll();
  return NextResponse.json(registrations);
}

export async function POST(req: NextRequest) {
  if (!(await isAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const reg: StoredRegistration = {
    id: randomUUID(),
    reference: body.reference?.trim() || makeReference(),
    submittedAt: new Date().toISOString(),
    driverName: body.driverName ?? "",
    copilotName: body.copilotName ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    carMake: body.carMake ?? "",
    carModel: body.carModel ?? "",
    carYear: body.carYear ?? "",
    extraParticipants: Number(body.extraParticipants) || 0,
    extraNames: body.extraNames ?? [],
    mealChoices: body.mealChoices ?? [],
    mealCost: Number(body.mealCost) || 0,
    total: Number(body.total) || 0,
    lang: body.lang ?? "en",
  };
  await appendOne(reg);
  return NextResponse.json(reg, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await removeOne(id);
  return NextResponse.json({ ok: true });
}
