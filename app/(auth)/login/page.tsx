"use client";

import { useEffect, useState } from "react";
import { adminConfigured, getAdminPins, setupAdminPin, sha256 } from "@/lib/pin";
import { getSession, setSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { matchPinAcrossEvents } from "@/lib/events";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"setup-admin"|"login">("login");
  const [adminPin, setAdminPin] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  useEffect(()=>{
    const s = getSession();
    if (s.authed && s.role) {
      if (s.role==="admin") router.replace("/gestor");
      else router.replace("/planilha");
      return;
    }
    setPhase(adminConfigured() ? "login" : "setup-admin");
  },[router]);

  async function onSetup(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!adminPin.trim()) { setErr("Informe um PIN mestre."); return; }
    await setupAdminPin(adminPin);
    setPhase("login"); alert("PIN mestre configurado.");
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = pin.trim(); if (!p) return;

    // 1) Admin?
    const h = await sha256(p);
    const admin = getAdminPins();
    if (admin.adminHash && h === admin.adminHash) {
      setSession({ authed:true, role:"admin", pin:p, eventId:null });
      router.replace("/gestor"); return;
    }

    // 2) Juiz/Coord por evento
    const match = await matchPinAcrossEvents(p);
    if (match) {
      setSession({ authed:true, role:match.role, pin:p, eventId: match.eventId });
      router.replace(match.role==="judge" ? "/planilha" : "/coordenacao"); return;
    }

    setErr("PIN inválido.");
  }

  return (
    <main className="container-page">
      <div className="max-w-md mx-auto card p-5">
        <h1 className="text-xl font-semibold mb-4">{phase==="setup-admin" ? "Configurar PIN Mestre" : "Entrar com PIN"}</h1>

        {phase==="setup-admin" ? (
          <form onSubmit={onSetup} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">PIN Mestre (Gestor)</label>
              <input value={adminPin} onChange={e=>setAdminPin(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Defina o PIN mestre" autoFocus />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end">
              <button className="px-3 py-2 border rounded-md bg-gray-900 text-white">Salvar PIN Mestre</button>
            </div>
          </form>
        ) : (
          <form onSubmit={onLogin} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">PIN</label>
              <input value={pin} onChange={e=>setPin(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Digite PIN do evento ou PIN mestre" autoFocus />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end">
              <button className="px-3 py-2 border rounded-md bg-gray-900 text-white">Entrar</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Dica: PIN mestre leva ao Painel do Gestor; PIN de juiz/coord leva direto ao evento.
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
