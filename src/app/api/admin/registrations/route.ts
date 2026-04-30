import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { isTokenRevoked } from "@/lib/admin-config";
import { readAll, appendOne, removeOne } from "@/lib/store";
import type { StoredRegistration } from "@/lib/store";
import { randomUUID } from "crypto";

async function getAuthUser(): Promise<string | null> {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return null;
  const username = await verifyToken(token);
  if (!username) return null;
  // Check token has not been revoked (logout blocklist)
  if (await isTokenRevoked(token)) return null;
  return username;
}

function makeReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `RIST-2026-${suffix}`;
}

function sanitise(val: unknown, maxLen = 120): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

export async function GET() {
  if (!(await getAuthUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const registrations = await readAll();
  return NextResponse.json(registrations);
}

export async function POST(req: NextRequest) {
  if (!(await getAuthUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Sanitise all string inputs — admin manual entries must be clean too
  const driverName       = sanitise(body.driverName);
  const copilotName      = sanitise(body.copilotName);
  const email            = sanitise(body.email, 254);
  const phone            = sanitise(body.phone, 30);
  const carMake          = sanitise(body.carMake, 60);
  const carModel         = sanitise(body.carModel, 60);
  const carYear          = sanitise(body.carYear, 4);
  const extraParticipants = Math.max(0, Math.min(2, Number(body.extraParticipants) || 0));
  const extraNames: string[] = Array.isArray(body.extraNames)
    ? body.extraNames.map((n: unknown) => sanitise(n)).slice(0, extraParticipants)
    : [];

  // Validate meal choices and recompute totals server-side — never trust the client
  const rawMeals: Array<{ include: boolean; menu: string }> = Array.isArray(body.mealChoices)
    ? body.mealChoices.slice(0, 2 + extraParticipants).map((m: unknown) => ({
        include: (m as { include?: unknown }).include === true,
        menu: ["1", "2", "3"].includes(String((m as { menu?: unknown }).menu ?? ""))
          ? String((m as { menu?: unknown }).menu)
          : "1",
      }))
    : [];
  const mealCost = rawMeals.filter((m) => m.include).length * 35;
  const total    = 125 + extraParticipants * 20 + mealCost;

  const reg: StoredRegistration = {
    id: randomUUID(),
    reference: sanitise(body.reference, 20) || makeReference(),
    submittedAt: new Date().toISOString(),
    driverName,
    copilotName,
    email,
    phone,
    carMake,
    carModel,
    carYear,
    extraParticipants,
    extraNames,
    mealChoices: rawMeals,
    mealCost,
    total,
    lang: ["en", "fr", "lu"].includes(body.lang) ? body.lang : "en",
  };

  await appendOne(reg);
  return NextResponse.json(reg, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await getAuthUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await removeOne(id);
  return NextResponse.json({ ok: true });
}
