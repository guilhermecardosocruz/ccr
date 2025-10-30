import prisma from "@/lib/prisma";
import { sha256Hex, genAlphaNum } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: só informa se está configurado
export async function GET() {
  const row = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
  return Response.json({ ok: true, configured: Boolean(row?.value) });
}

// POST: { adminPin?: string, rotate?: boolean } -> retorna adminPin só nessa resposta
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let adminPin: string | undefined = body.adminPin ? String(body.adminPin).trim() : undefined;

    if (body.rotate || !adminPin) {
      adminPin = genAlphaNum(10);
    }

    await prisma.appSetting.upsert({
      where: { key: "admin_pin_hash" },
      create: { key: "admin_pin_hash", value: sha256Hex(adminPin) },
      update: { value: sha256Hex(adminPin) },
    });

    return Response.json({ ok: true, adminPin });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
