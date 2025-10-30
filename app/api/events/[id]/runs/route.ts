import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> lista runs do evento
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const rows = await prisma.run.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: "asc" },
    select: { id:true, teamId:true, score:true, timeSec:true, createdAt:true, team: { select: { name: true } } }
  });
  const runs = rows.map(r=>({ team: r.team.name, score: Number(r.score), timeSec: r.timeSec, at: new Date(r.createdAt).getTime() }));
  return new Response(JSON.stringify(runs), { headers: { "content-type": "application/json" } });
}

// POST { teamName, score, timeSec, notes? }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { teamName, score, timeSec, notes } = await req.json();
    if (!teamName || typeof score !== "number" || typeof timeSec !== "number") {
      return new Response(JSON.stringify({ ok:false, error:"invalid_payload" }), { status: 400 });
    }
    const team = await prisma.team.findFirst({ where: { eventId: params.id, name: String(teamName) } });
    if (!team) return new Response(JSON.stringify({ ok:false, error:"team_not_found" }), { status: 404 });

    // regra de 3 tentativas por equipe
    const count = await prisma.run.count({ where: { eventId: params.id, teamId: team.id } });
    if (count >= 3) return new Response(JSON.stringify({ ok:false, error:"max_runs_reached" }), { status: 400 });

    await prisma.run.create({ data: { eventId: params.id, teamId: team.id, score, timeSec, notes: notes ?? null } });
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"bad_request" }), { status: 400 });
  }
}

// DELETE -> limpa todas as runs do evento
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.run.deleteMany({ where: { eventId: params.id } });
  return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
}
