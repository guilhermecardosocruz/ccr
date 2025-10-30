"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { listEvents } from "@/lib/events";

export default function AppMenu() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<"admin" | "judge" | "coord" | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    const s = getSession();
    setRole(s.role);
    setEventId(s.eventId);
    setReady(true);

    async function loadEvent() {
      if (s.eventId) {
        try {
          const events = await listEvents();
          const ev = events.find((e) => e.id === s.eventId);
          setEventName(ev?.name || "");
        } catch (err) {
          console.error("Erro ao carregar eventos:", err);
        }
      }
    }
    loadEvent();
  }, []);

  function onLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="font-semibold">CCR • Placar</div>

        {!ready ? (
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        ) : (
          <div className="flex items-center gap-4 text-sm">
            {role === "admin" ? (
              <>
                <Link href="/gestor" className="hover:underline">Gestor</Link>
                {!!eventId && (
                  <>
                    <span className="text-gray-500 truncate max-w-[14rem]" title={eventName || eventId}>
                      Evento: {eventName || eventId}
                    </span>
                    <Link href="/planilha" className="hover:underline">Planilha</Link>
                    <Link href="/equipes" className="hover:underline">Equipes</Link>
                    <Link href="/resultado" className="hover:underline">Resultado</Link>
                    <Link href="/coordenacao" className="hover:underline">Coordenação</Link>
                  </>
                )}
              </>
            ) : role ? (
              <>
                <Link href="/planilha" className="hover:underline">Planilha</Link>
                <Link href="/equipes" className="hover:underline">Equipes</Link>
                <Link href="/resultado" className="hover:underline">Resultado</Link>
                <Link href="/coordenacao" className="hover:underline">Coordenação</Link>
              </>
            ) : (
              // Sem sessão: ainda assim mostramos atalhos úteis
              <>
                <Link href="/login" className="hover:underline">Login</Link>
              </>
            )}

            {/* Botão Sair SEMPRE visível, inclusive no /login e mesmo sem sessão */}
            <button
              onClick={onLogout}
              className="px-2 py-1 border rounded-md"
              title="Limpar sessão e voltar ao login"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
