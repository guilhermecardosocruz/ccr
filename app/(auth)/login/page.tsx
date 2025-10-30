"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginByPin } from "@/lib/pin";
import { getSession, setSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const p = pin.trim();
    if (!p) { setErr("Informe o PIN."); return; }
    setLoading(true);
    try {
      const res = await loginByPin(p);
      if (!res.ok) {
        if (res.error === "invalid_pin") setErr("PIN inválido.");
        else setErr(res.error || "Falha no login.");
        return;
      }

      // Salva sessão com o papel correto
      const s = getSession();
      setSession({
        authed: true,
        role: res.role,
        pin: p,
        eventId: res.eventId, // admin: null; judge/coord: eventId do evento
      });

      // Roteia conforme o papel
      if (res.role === "admin") {
        router.replace("/gestor");
      } else if (res.role === "judge") {
        router.replace("/planilha"); // juiz
      } else if (res.role === "coord") {
        router.replace("/coordenacao"); // coordenação
      }
    } catch (e) {
      console.error("login error", e);
      setErr("Erro ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-lg p-4 bg-white">
        <div className="text-lg font-semibold">Entrar com PIN</div>
        <div>
          <label className="block text-sm mb-1">PIN</label>
          <input
            value={pin}
            onChange={(e)=>setPin(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            placeholder="Digite PIN do evento ou PIN mestre"
            autoFocus
          />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 border rounded-md bg-gray-900 text-white disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Dica: PIN mestre leva ao Painel do Gestor; PIN de juiz/coord leva para a planilha do evento.
        </div>
      </form>
    </div>
  );
}
