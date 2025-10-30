"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { keyResults, keyTeams } from "@/lib/events";
import { loadJSON, saveJSON } from "@/lib/storage";
import { Run, compute } from "@/lib/ranking";

const mmss=(t:number)=>`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;

export default function Page(){
  return (
    <RouteGuard need="coord" needEvent>
      <Inner />
    </RouteGuard>
  );
}

function Inner(){
  const sess = getSession();
  const RESULTS_KEY = keyResults(sess.eventId!);
  const TEAMS_KEY   = keyTeams(sess.eventId!);

  // ---------- Equipes (CRUD) ----------
  const [teams,setTeams]=useState<string[]>([]);
  const [name,setName]=useState("");
  const [edit,setEdit]=useState<number|null>(null);
  const [val,setVal]=useState("");

  useEffect(()=>{ setTeams(loadJSON<string[]>(TEAMS_KEY,[])); },[TEAMS_KEY]);
  useEffect(()=>{ saveJSON(TEAMS_KEY,teams); },[teams,TEAMS_KEY]);

  function addTeam(){ const n=name.trim(); if(!n || teams.includes(n)) return; setTeams([...teams,n]); setName(""); }
  function rmTeam(i:number){ const cp=[...teams]; cp.splice(i,1); setTeams(cp); }
  function startEdit(i:number){ setEdit(i); setVal(teams[i]); }
  function saveEdit(){ if(edit===null) return; const v=val.trim(); if(!v) return; const cp=[...teams]; cp[edit]=v; setTeams(cp); setEdit(null); setVal(""); }

  // ---------- Resultados / Ranking ----------
  const [runs,setRuns]=useState<Run[]>([]);
  useEffect(()=>{ setRuns(loadJSON<Run[]>(RESULTS_KEY,[])); },[RESULTS_KEY]);

  const byTeam = useMemo(()=>{ const m=new Map<string,Run[]>(); for(const r of runs){ if(!m.has(r.team)) m.set(r.team,[]); m.get(r.team)!.push(r);} for(const a of m.values()) a.sort((x,y)=>x.at-y.at); return m;},[runs]);
  const rows = useMemo(()=>compute(byTeam),[byTeam]);

  return (
    <main className="container-page max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Copa Criciúma de Robótica</h1>
          <p className="text-sm text-gray-500">Coordenação — gerenciamento de equipes e visão completa (3 rodadas).</p>
        </div>
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-white">LOGO</div>
      </header>

      {/* ---------- Gestão de Equipes ---------- */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Equipes do evento</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e=>setName(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Nome da equipe"
          />
        <button onClick={addTeam} className="px-3 py-2 border rounded-md">Adicionar</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="text-left px-3 py-2">Equipe</th><th className="w-40 px-3 py-2">Ações</th></tr>
            </thead>
            <tbody>
              {teams.length===0 ? (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-500">Nenhuma equipe cadastrada.</td></tr>
              ) : teams.map((t,i)=>(
                <tr key={`${t}-${i}`} className={i%2?"bg-white":"bg-gray-50/60"}>
                  <td className="px-3 py-2">
                    {edit===i
                      ? <input value={val} onChange={e=>setVal(e.target.value)} className="border rounded-md px-2 py-1 w-full" />
                      : t}
                  </td>
                  <td className="px-3 py-2">
                    {edit===i ? (
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-2 py-1 border rounded-md">Salvar</button>
                        <button onClick={()=>{setEdit(null); setVal("");}} className="px-2 py-1 border rounded-md">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={()=>startEdit(i)} className="px-2 py-1 border rounded-md">Editar</button>
                        <button onClick={()=>rmTeam(i)} className="px-2 py-1 border rounded-md">Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Ranking detalhado ---------- */}
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
              {rows.length===0 ? (
                <tr><td colSpan={8} className="px-2 py-8 text-center text-gray-500">Sem rodadas salvas.</td></tr>
              ) : rows.map((r,i)=>{
                  const cells=[0,1,2].map(k=>{
                    const run=r.runs[k]; if(!run) return <td key={k} className="px-2 py-2 text-gray-400">—</td>;
                    const considered=r.pickedIdx.includes(k);
                    return (
                      <td key={k} className="px-2 py-2">
                        <div className={`inline-flex flex-col rounded-md border px-2 py-1 ${considered?"bg-gray-50":"opacity-80"}`}>
                          <span className="font-medium">{run.score.toFixed(2)}</span>
                          <span className="text-[11px] text-gray-500">{mmss(run.timeSec)}</span>
                        </div>
                      </td>
                    );
                  });
                  return (
                    <tr key={r.team} className={i%2?"bg-white":"bg-gray-50/60"}>
                      <td className="px-2 py-2 font-semibold">{i+1}</td>
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
