import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// POST { pin: string } -> { ok, role, eventId } | { ok:false }
export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const hash = await sha256(String(pin ?? "").trim());

    const rows = await prisma.eventPins.findMany({
      select: { eventId: true, judgeHash: true, coordHash: true, event: { select: { id: true } } }
    });

    for (const r of rows) {
      if (r.judgeHash && r.judgeHash === hash) {
        return new Response(JSON.stringify({ ok:true, role:"judge", eventId: r.eventId }), { headers: { "content-type": "application/json" } });
      }
      if (r.coordHash && r.coordHash === hash) {
        return new Response(JSON.stringify({ ok:true, role:"coord", eventId: r.eventId }), { headers: { "content-type": "application/json" } });
      }
    }
    return new Response(JSON.stringify({ ok:false, error: "pin_not_found" }), { status: 200, headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error: "bad_request" }), { status: 400 });
  }
}
