import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// GET -> { judge: boolean, coord: boolean }
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = await prisma.eventPins.findUnique({ where: { eventId: params.id } });
  return new Response(JSON.stringify({
    hasJudge: !!p?.judgeHash,
    hasCoord: !!p?.coordHash
  }), { headers: { "content-type": "application/json" } });
}

// PUT body: { judgePin?: string, coordPin?: string } -> define/rota
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=> ({}));
    const data: { judgeHash?: string|null; coordHash?: string|null; rotatedAt?: Date } = { rotatedAt: new Date() };
    if (typeof body.judgePin === "string") data.judgeHash = await sha256(body.judgePin.trim());
    if (typeof body.coordPin  === "string") data.coordHash  = await sha256(body.coordPin.trim());

    await prisma.eventPins.upsert({
      where: { eventId: params.id },
      create: { eventId: params.id, ...data },
      update: data
    });
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error: "bad_request" }), { status: 400 });
  }
}
