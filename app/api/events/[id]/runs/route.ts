import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Shape que o frontend espera */
type RunDTO = { team: string; score: number; timeSec: number; at: number };

function toDTO(row: {
  score: any; timeSec: number; createdAt: Date; team: { name: string }
}): RunDTO {
  return {
    team: row.team.name,
    score: Number(row.score),
    timeSec: row.timeSec,
    at: Math.floor(new Date(row.createdAt).getTime()),
  };
}

/** GET -> retorna RunDTO[] (ordenado por createdAt asc) */
export async function GET(_req: Request, ctx: any) {
  const eventId: string | undefined = ctx?.params?.id;
  if (!eventId) return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });

  const rows = await prisma.run.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      score: true,
      timeSec: true,
      createdAt: true,
      team: { select: { name: true } },
    },
  });

  const out: RunDTO[] = rows.map(toDTO);
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
}

/** POST -> { teamName, score, timeSec, notes? } cria uma nova rodada */
export async function POST(req: Request, ctx: any) {
  try {
    const eventId: string | undefined = ctx?.params?.id;
    if (!eventId) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });

    const body = await req.json().catch(() => ({}));
    const teamName = String(body?.teamName || "").trim();
    const score    = Number(body?.score);
    const timeSec  = Number(body?.timeSec);
    const notes    = body?.notes ? String(body.notes) : undefined;

    if (!teamName) return new Response(JSON.stringify({ ok:false, error:"invalid_team" }), { status: 400 });
    if (!Number.isFinite(score)) return new Response(JSON.stringify({ ok:false, error:"invalid_score" }), { status: 400 });
    if (!Number.isInteger(timeSec) || timeSec < 0) return new Response(JSON.stringify({ ok:false, error:"invalid_time" }), { status: 400 });

    const team = await prisma.team.findFirst({ where: { eventId, name: teamName } });
    if (!team) return new Response(JSON.stringify({ ok:false, error:"team_not_found" }), { status: 404 });

    await prisma.run.create({
      data: { eventId, teamId: team.id, score, timeSec, notes },
    });

    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type": "application/json" } });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || "bad_request" }), { status: 400 });
  }
}

/** DELETE -> limpa todas as runs do evento */
export async function DELETE(_req: Request, ctx: any) {
  try {
    const eventId: string | undefined = ctx?.params?.id;
    if (!eventId) return new Response(JSON.stringify({ ok:false, error:"missing_id" }), { status: 400 });
    await prisma.run.deleteMany({ where: { eventId } });
    return new Response(JSON.stringify({ ok:true }), { headers: { "content-type":"application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"bad_request" }), { status: 400 });
  }
}

/** HEAD de saúde */
export async function HEAD(_req: Request) {
  return new Response(null, { status: 204 });
}
