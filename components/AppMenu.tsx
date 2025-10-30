"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";
import { useRouter, usePathname } from "next/navigation";
import { listEvents } from "@/lib/events";

export default function AppMenu() {
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="font-semibold">CCR • Placar</div>
        {!ready ? (
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        ) : role ? (
          <div className="flex items-center gap-4 text-sm">
            {role === "admin" ? (
              <>
                <Link href="/gestor" className="hover:underline">
                  Gestor
                </Link>
                {!!eventId && (
                  <>
                    <span
                      className="text-gray-500 truncate max-w-[14rem]"
                      title={eventName || eventId}
                    >
                      Evento: {eventName || eventId}
                    </span>
                    <Link href="/planilha" className="hover:underline">
                      Planilha
                    </Link>
                    <Link href="/equipes" className="hover:underline">
                      Equipes
                    </Link>
                    <Link href="/resultado" className="hover:underline">
                      Resultado
                    </Link>
                    <Link href="/coordenacao" className="hover:underline">
                      Coordenação
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/planilha" className="hover:underline">
                  Planilha
                </Link>
                <Link href="/equipes" className="hover:underline">
                  Equipes
                </Link>
                <Link href="/resultado" className="hover:underline">
                  Resultado
                </Link>
                <Link href="/coordenacao" className="hover:underline">
                  Coordenação
                </Link>
              </>
            )}
            {pathname !== "/login" && (
              <button
                onClick={() => {
                  clearSession();
                  router.push("/login");
                }}
                className="px-2 py-1 border rounded-md"
              >
                Sair
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm">
            {pathname !== "/login" && (
              <Link href="/login" className="underline">
                Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
