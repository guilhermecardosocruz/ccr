import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> lista nomes
export async function GET(_req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });

  const rows = await prisma.team.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true }
  });
  return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
}

// POST { name }
export async function POST(req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ ok:false, error:"invalid_name" }), { status: 400 });
    }
    const row = await prisma.team.create({ data: { eventId: id, name: name.trim() } });
    return new Response(JSON.stringify({ ok:true, team: row }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"duplicated_or_bad" }), { status: 400 });
  }
}

// PUT { oldName, newName }
export async function PUT(req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });

  try {
    const { oldName, newName } = await req.json();
    if (!oldName || !newName) return new Response(JSON.stringify({ ok:false, error:"invalid" }), { status: 400 });
    const team = await prisma.team.findFirst({ where: { eventId: id, name: oldName } });
    if (!team) return new Response(JSON.stringify({ ok:false, error:"not_found" }), { status: 404 });
    await prisma.team.update({ where: { id: team.id }, data: { name: String(newName) } });
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"bad_request" }), { status: 400 });
  }
}

// DELETE -> { name? } se enviar name, exclui uma; sem body: limpa todas
export async function DELETE(req: Request, ctx: any) {
  const id: string | undefined = ctx?.params?.id;
  if (!id) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });

  try {
    const body = await req.json().catch(()=> ({}));
    if (body?.name) {
      await prisma.team.deleteMany({ where: { eventId: id, name: String(body.name) } });
    } else {
      await prisma.run.deleteMany({ where: { eventId: id } });
      await prisma.team.deleteMany({ where: { eventId: id } });
    }
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"bad_request" }), { status: 400 });
  }
}
