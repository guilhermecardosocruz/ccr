import prisma from "@/lib/prisma";
import { sha256Hex, genNumeric, genAlphaNum } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: lista eventos (id, name)
export async function GET() {
  const rows = await prisma.event.findMany({
    select: { id: true, name: true, createdAt: true, archived: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows);
}

// POST: cria evento e já gera PINs padrão (retorna PINs em texto apenas nessa resposta)
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    const n = String(name ?? "").trim();
    if (!n) return new Response(JSON.stringify({ ok: false, error: "invalid_name" }), { status: 400 });

    const ev = await prisma.event.create({ data: { name: n } });

    // Gera PINs iniciais
    const judgePin = genNumeric(6);
    const coordPin = genAlphaNum(8);
    await prisma.eventPins.create({
      data: {
        eventId: ev.id,
        judgeHash: sha256Hex(judgePin),
        coordHash: sha256Hex(coordPin),
      },
    });

    return Response.json({ ok: true, event: { id: ev.id, name: ev.name }, pins: { judgePin, coordPin } });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
