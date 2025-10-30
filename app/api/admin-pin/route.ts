import prisma from "@/lib/prisma";
import { sha256Hex, genAlphaNum } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: informa se existe configuração (ENV ou banco)
export async function GET() {
  const hasEnv = Boolean(process.env.ADMIN_MASTER_PIN?.trim());
  if (hasEnv) {
    return Response.json({ ok: true, configured: true, source: "env" });
  }
  const row = await prisma.appSetting.findUnique({ where: { key: "admin_pin_hash" } });
  return Response.json({ ok: true, configured: Boolean(row?.value), source: "db" });
}

// POST / PUT: cria ou rotaciona o PIN do admin
export async function POST(req: Request) {
  return handleUpsert(req);
}
export async function PUT(req: Request) {
  return handleUpsert(req);
}

async function handleUpsert(req: Request) {
  try {
    const hasEnv = Boolean(process.env.ADMIN_MASTER_PIN?.trim());
    if (hasEnv) {
      // Se há PIN mestre via ENV, evita sobrescrever
      return new Response(JSON.stringify({ ok: false, error: "env_master_pin_in_use" }), { status: 409 });
    }

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
  } catch (e) {
    console.error("Erro em admin-pin:", e);
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), { status: 400 });
  }
}
