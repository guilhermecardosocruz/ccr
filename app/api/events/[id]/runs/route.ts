export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const runs = await prisma.run.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        teamId: true,
        score: true,
        timeSec: true,
        notes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, data: runs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal_error" }, { status: 500 });
  }
}

export async function HEAD(_req: Request) {
  return new Response(null, { status: 204 });
}
