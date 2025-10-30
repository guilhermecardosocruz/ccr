import prisma from "@/lib/prisma";
import { sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const p = String(pin ?? "").trim();
    if (!p) return new Response(JSON.stringify({ ok: false, error: "missing_pin" }), { status: 400 });

    // 0) PIN Mestre via ENV (prioritário, independe do banco)
    const envMaster = process.env.ADMIN_MASTER_PIN?.trim();
    if (envMaster && p === envMaster) {
      return Response.json({ ok: true, role: "admin", eventId: null });
    }

    const h = sha256Hex(p);

    // 1) Admin no banco?
    const admin = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
    if (admin?.value && admin.value === h) {
      return Response.json({ ok: true, role: "admin", eventId: null });
    }

    // 2) Verifica pinos dos eventos (juiz/coord)
    const pinsList = await prisma.eventPins.findMany({
      select: { eventId: true, judgeHash: true, coordHash: true },
    });
    for (const row of pinsList) {
      if (row.judgeHash && row.judgeHash === h) {
        return Response.json({ ok: true, role: "judge", eventId: row.eventId });
      }
      if (row.coordHash && row.coordHash === h) {
        return Response.json({ ok: true, role: "coord", eventId: row.eventId });
      }
    }

    return new Response(JSON.stringify({ ok: false, error: "invalid_pin" }), { status: 401 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
