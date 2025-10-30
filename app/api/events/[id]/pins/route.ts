import prisma from "@/lib/prisma";
import { sha256Hex, genAlphaNum, genNumeric } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: retorna apenas que existem (não expõe plaintext)
export async function GET(_req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "missing_id" }), { status: 400 });
  const pins = await prisma.eventPins.findUnique({ where: { eventId: id } });
  const hasJudge = Boolean(pins?.judgeHash);
  const hasCoord = Boolean(pins?.coordHash);
  return Response.json({ ok: true, hasJudge, hasCoord, rotatedAt: pins?.rotatedAt ?? null });
}

/**
 * POST: rotaciona ou define PINs
 * body:
 *  - rotate: boolean (se true, gera novos aleatórios)
 *  - judgePin?: string  (opcional — define manual)
 *  - coordPin?: string  (opcional — define manual)
 * Retorna sempre os PINs em texto APENAS nessa resposta (para copiar).
 */
export async function POST(req: Request, ctx: any) {
  try {
    const id: string | undefined = ctx?.params?.id;
    if (!id) return new Response(JSON.stringify({ ok: false, error: "missing_id" }), { status: 400 });

    const body = await req.json().catch(() => ({}));
    let judgePin: string | undefined = body.judgePin ? String(body.judgePin).trim() : undefined;
    let coordPin: string | undefined = body.coordPin ? String(body.coordPin).trim() : undefined;

    if (body.rotate) {
      judgePin = genNumeric(6);
      coordPin = genAlphaNum(8);
    }
    if (!judgePin && !coordPin) {
      return new Response(JSON.stringify({ ok: false, error: "nothing_to_set" }), { status: 400 });
    }

    await prisma.eventPins.upsert({
      where: { eventId: id },
      create: {
        eventId: id,
        judgeHash: judgePin ? sha256Hex(judgePin) : null,
        coordHash: coordPin ? sha256Hex(coordPin) : null,
      },
      update: {
        judgeHash: judgePin ? sha256Hex(judgePin) : undefined,
        coordHash: coordPin ? sha256Hex(coordPin) : undefined,
        rotatedAt: new Date(),
      },
    });

    return Response.json({ ok: true, pins: { judgePin, coordPin } });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
