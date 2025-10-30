import prisma from "@/lib/prisma";
import { sha256 } from "@/lib/crypto"; // retorna Buffer

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const p = String(pin ?? "").trim();
    if (!p) {
      return new Response(JSON.stringify({ ok: false, error: "missing_pin" }), { status: 400 });
    }

    // 1) PIN Mestre via ENV (plaintext)
    const master = process.env.ADMIN_MASTER_PIN?.trim();
    if (master && p === master) {
      return Response.json({ ok: true, role: "admin", eventId: null });
    }

    // 2) Admin hash salvo no banco (comparar como HEX)
    const hashHex = sha256(p).toString("hex");
    const admin = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
    if (admin?.value && admin.value === hashHex) {
      return Response.json({ ok: true, role: "admin", eventId: null });
    }

    // 3) PINs de evento (juiz/coord) — também com HEX
    const pinsList = await prisma.eventPins.findMany({
      select: { eventId: true, judgeHash: true, coordHash: true },
    });
    for (const row of pinsList) {
      if (row.judgeHash && row.judgeHash === hashHex) {
        return Response.json({ ok: true, role: "judge", eventId: row.eventId });
      }
      if (row.coordHash && row.coordHash === hashHex) {
        return Response.json({ ok: true, role: "coord", eventId: row.eventId });
      }
    }

    return new Response(JSON.stringify({ ok: false, error: "invalid_pin" }), { status: 401 });
  } catch (e) {
    console.error("pin-login error:", e);
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
