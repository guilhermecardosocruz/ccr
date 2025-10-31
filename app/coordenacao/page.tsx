"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useMemo, useState } from "react";
import { getSession, setSession } from "@/lib/session";  // Importando setSession corretamente
import { useRouter } from "next/navigation";  // Adicionando o useRouter
import { listTeams, listRuns } from "@/lib/events";
import { Run as R, compute } from "@/lib/ranking";

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export default function Page() {
  return (
    <RouteGuard need="coord" needEvent>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const router = useRouter();  // Definindo o router
  const sess = getSession();
  const eventId = sess.eventId!;

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { listTeams(eventId).then(setTeams); }, [eventId]);

  const [runs, setRuns] = useState<R[]>([]);
  useEffect(() => { listRuns(eventId).then(setRuns); }, [eventId]);

  const byTeam = useMemo(() => {
    const m = new Map<string, R[]>();
    for (const r of runs) {
      if (!m.has(r.team)) m.set(r.team, []);
      m.get(r.team)!.push(r);
    }
    for (const a of m.values()) a.sort((x, y) => x.at - y.at);
    return m;
  }, [runs]);

  const rows = useMemo(() => compute(byTeam), [byTeam]);

  function openFor(id: string, path: string) {
    const s = getSession();
    setSession({ ...s, eventId: id });
    router.push(path);  // Agora router está definido corretamente
  }

  return (
    <main className="container-page max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Copa Criciúma de Robótica</h1>
          <p className="text-sm text-gray-500">Coordenação — gerenciamento de equipes e visão completa (3 rodadas).</p>
        </div>
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-white">LOGO</div>
      </header>

      {/* Botão para o Telão */}
      <section className="card p-4 space-y-4">
        <button
          onClick={() => openFor(eventId, "/telao")}
          className="px-2 py-1 border rounded-md bg-blue-500 text-white"
        >
          Telão
        </button>
      </section>

      {/* lista simples de equipes */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Equipes do evento</h2>
        <ul className="list-disc pl-6 text-sm">
          {teams.map((t) => <li key={t.id}>{t.name}</li>)}
        </ul>
      </section>

      {/* Ranking detalhado */}
      <section className="card p-3 md:p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Equipe</th>
                <th className="px-2 py-2">Rod. 1</th>
                <th className="px-2 py-2">Rod. 2</th>
                <th className="px-2 py-2">Rod. 3</th>
                <th className="px-2 py-2">Ranking</th>
                <th className="px-2 py-2">Soma total</th>
                <th className="px-2 py-2">Tempo (considerado)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="px-2 py-8 text-center text-gray-500">Sem rodadas salvas.</td></tr>
              ) : rows.map((r, i) => {
                  const cells = [0, 1, 2].map(k => {
                    const run = r.runs[k]; 
                    if (!run) return <td key={k} className="px-2 py-2 text-gray-400">—</td>;
                    const considered = r.pickedIdx.includes(k);
                    return (
                      <td key={k} className="px-2 py-2">
                        <div className={`inline-flex flex-col rounded-md border px-2 py-1 ${considered ? "bg-gray-50" : "opacity-80"}`}>
                          <span className="font-medium">{run.score.toFixed(2)}</span>
                          <span className="text-[11px] text-gray-500">{mmss(run.timeSec)}</span>
                        </div>
                      </td>
                    );
                  });
                  return (
                    <tr key={r.team} className={i % 2 ? "bg-white" : "bg-gray-50/60"}>
                      <td className="px-2 py-2 font-semibold">{i + 1}</td>
                      <td className="px-2 py-2">{r.team}</td>
                      {cells}
                      <td className="px-2 py-2 font-semibold">{r.rankingScore.toFixed(2)}</td>
                      <td className="px-2 py-2">{r.tieTotal.toFixed(2)}</td>
                      <td className="px-2 py-2">{mmss(r.tieTime)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
