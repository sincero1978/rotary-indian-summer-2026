import { NextResponse } from "next/server";
import { readRallies } from "@/lib/rallies";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readRallies(), {
    headers: { "Cache-Control": "no-store" },
  });
}
