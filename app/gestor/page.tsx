"use client";

import RouteGuard from "@/components/RouteGuard";
import { createEvent, listEvents, keyTeams, keyResults } from "@/lib/events";
import { useEffect, useState } from "react";
import { getSession, setSession } from "@/lib/session";
import { getEventPins, getEventPinsPlain, setEventPins } from "@/lib/pin";
import { saveJSON } from "@/lib/storage";
import Link from "next/link";

function genNumeric(n:number){ return Array.from({length:n},()=>Math.floor(Math.random()*10)).join(""); }
function genAlphaNum(n:number){ const cs="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let o=""; for(let i=0;i<n;i++) o+=cs[Math.floor(Math.random()*cs.length)]; return o; }

function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title?:string;children:React.ReactNode}) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded-md">Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GestorPage() {
  return (
    <RouteGuard need="admin">
      <GestorInner />
    </RouteGuard>
  );
}

function GestorInner() {
  const [events, setEvents] = useState(listEvents());
  const [name, setName] = useState("");

  const [showPinsOf, setShowPinsOf] = useState<string|null>(null); // eventId para modal

  useEffect(()=>{ setEvents(listEvents()); }, []);

  function addEvent() {
    const n = name.trim(); if (!n) return;
    const e = createEvent(n);
    // gera PINs padrão
    setEventPins(e.id, genNumeric(6), genAlphaNum(8));
    setName(""); setEvents(listEvents());
    setShowPinsOf(e.id); // já abre o modal com os PINs gerados
  }

  function makeActive(id: string) {
    const s = getSession();
    setSession({ ...s, eventId: id });
    alert("Evento ativo selecionado.");
  }

  function rotatePins(id: string) {
    setEventPins(id, genNumeric(6), genAlphaNum(8));
    setShowPinsOf(id); // exibir os novos
  }

  function resetData(id: string) {
    if (!confirm("Limpar equipes e resultados deste evento?")) return;
    saveJSON(keyTeams(id), []);
    saveJSON(keyResults(id), []);
    alert("Dados limpos.");
  }

  function copy(txt: string) {
    navigator.clipboard.writeText(txt).then(()=>alert("Copiado!"));
  }

  return (
    <main className="container-page space-y-6">
      <header className="card p-4">
        <h1 className="text-lg font-semibold mb-2">Painel do Gestor</h1>
        <div className="flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} className="border rounded-md px-3 py-2 w-full" placeholder="Nome do evento" />
          <button onClick={addEvent} className="px-3 py-2 border rounded-md">Criar evento</button>
        </div>
      </header>

      <section className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Evento</th>
              <th className="px-3 py-2">PIN Juiz</th>
              <th className="px-3 py-2">PIN Coord</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.length===0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Nenhum evento.</td></tr>
            ) : events.map((e,i)=>{
              const pins = getEventPins(e.id);
              const jMask = pins.judgeHash ? "••••••" : "—";
              const cMask = pins.coordHash ? "••••••••" : "—";
              return (
                <tr key={e.id} className={i%2?"bg-white":"bg-gray-50/60"}>
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2">{jMask}</td>
                  <td className="px-3 py-2">{cMask}</td>
                  <td className="px-3 py-2 flex flex-wrap gap-2">
                    <button onClick={()=>makeActive(e.id)} className="px-2 py-1 border rounded-md">Ativar evento</button>
                    <Link href="/planilha" className="px-2 py-1 border rounded-md">Planilha</Link>
                    <Link href="/equipes" className="px-2 py-1 border rounded-md">Equipes</Link>
                    <Link href="/resultado" className="px-2 py-1 border rounded-md">Resultado</Link>
                    <Link href="/coordenacao" className="px-2 py-1 border rounded-md">Coordenação</Link>
                    <button onClick={()=>setShowPinsOf(e.id)} className="px-2 py-1 border rounded-md">Mostrar PINs</button>
                    <button onClick={()=>rotatePins(e.id)} className="px-2 py-1 border rounded-md">Rotacionar PINs</button>
                    <button onClick={()=>resetData(e.id)} className="px-2 py-1 border rounded-md">Limpar dados</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Modal para exibir PINs em texto */}
      <Modal
        open={!!showPinsOf}
        onClose={()=>setShowPinsOf(null)}
        title="PINs do evento"
      >
        {showPinsOf && (() => {
          const p = getEventPinsPlain(showPinsOf);
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-600">PIN Juiz</div>
                  <div className="text-xl font-semibold">{p.judgePin ?? "—"}</div>
                </div>
                {p.judgePin && <button onClick={()=>copy(p.judgePin!)} className="px-2 py-1 border rounded-md">Copiar</button>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-600">PIN Coordenação</div>
                  <div className="text-xl font-semibold">{p.coordPin ?? "—"}</div>
                </div>
                {p.coordPin && <button onClick={()=>copy(p.coordPin!)} className="px-2 py-1 border rounded-md">Copiar</button>}
              </div>
              <p className="text-xs text-gray-500">Obs.: os PINs ficam salvos apenas neste dispositivo (localStorage). Ao “Rotacionar PINs”, novos valores são gerados e exibidos aqui.</p>
            </div>
          );
        })()}
      </Modal>
    </main>
  );
}
