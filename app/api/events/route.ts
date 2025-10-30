import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> lista de eventos com nome e createdAt
export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, archived: true }
  });
  return new Response(JSON.stringify(events), { headers: { "content-type": "application/json" } });
}

// POST { name } -> cria evento + pins vazios
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ ok:false, error: "invalid_name" }), { status: 400 });
    }
    const event = await prisma.event.create({ data: { name: name.trim() } });
    await prisma.eventPins.create({ data: { eventId: event.id } });
    return new Response(JSON.stringify({ ok:true, event }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: "bad_request" }), { status: 400 });
  }
}
