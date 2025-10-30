export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const pins = await prisma.eventPins.findUnique({
      where: { eventId: id },
      select: { judgeHash: true, coordHash: true, rotatedAt: true },
    });
    return NextResponse.json({ ok: true, data: pins ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal_error" }, { status: 500 });
  }
}

export async function HEAD(_req: Request) {
  return new Response(null, { status: 204 });
}
