"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listRuns } from "@/lib/events";
import { Run, compute } from "@/lib/ranking";

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RankingCoordenacaoPage() {
  const sess = getSession();
  const eventId = sess.eventId!;
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => { listRuns(eventId).then(setRuns); }, [eventId]);

  const byTeam = useMemo(() => {
    const map = new Map<string, Run[]>();
    for (const r of runs) {
      if (!map.has(r.team)) map.set(r.team, []);
      map.get(r.team)!.push(r);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.at - b.at);
    return map;
  }, [runs]);

  const rows = useMemo(() => compute(byTeam), [byTeam]);

  return (
    <main className="container-page max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Copa Criciúma de Robótica</h1>
          <p className="text-sm text-gray-500">
            Ranking Coordenação — melhor de 3 (corta a menor), desempates: soma total → menor tempo.
          </p>
        </div>
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-white">
          LOGO
        </div>
      </header>

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
                <th className="px-2 py-2">Ranking (2 melhores)</th>
                <th className="px-2 py-2">Soma total</th>
                <th className="px-2 py-2">Tempo (considerado)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-center text-gray-500">
                    Sem rodadas salvas ainda.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const cells = [0, 1, 2].map((k) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
