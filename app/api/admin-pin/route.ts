import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// GET -> { configured: boolean }
export async function GET() {
  const row = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
  return new Response(JSON.stringify({ configured: !!row }), { headers: { "content-type": "application/json" } });
}

// POST body: { pin: string } -> define/atualiza hash
export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return new Response(JSON.stringify({ ok:false, error: "PIN inválido" }), { status: 400 });
    }
    const hash = await sha256(pin.trim());
    await prisma.appSetting.upsert({
      where: { key: "admin_pin_hash" },
      update: { value: hash },
      create: { key: "admin_pin_hash", value: hash },
    });
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error: "bad_request" }), { status: 400 });
  }
}

// PUT body: { pin: string } -> valida
export async function PUT(req: Request) {
  try {
    const { pin } = await req.json();
    const row = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
    if (!row) return new Response(JSON.stringify({ ok:false, match:false, error: "not_configured" }), { status: 200 });
    const hash = await sha256(String(pin ?? "").trim());
    const match = row.value === hash;
    return new Response(JSON.stringify({ ok:true, match }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error: "bad_request" }), { status: 400 });
  }
}
