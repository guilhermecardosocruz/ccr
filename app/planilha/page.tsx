"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams } from "@/lib/events";

export default function Page() {
  return (
    <RouteGuard need="judge_or_coord" needEvent>
      <Planilha />
    </RouteGuard>
  );
}

function Planilha() {
  const sess = getSession();
  const eventId = sess.eventId || new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("eventId") || "";

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!eventId) return;
    listTeams(eventId).then((rows) => Array.isArray(rows) && setTeams(rows)).catch(() => setTeams([]));
  }, [eventId]);

  return (
    <main className="container-page space-y-4">
      <header className="card p-4">
        <h1 className="text-lg font-semibold">Planilha de Pontuação</h1>
        <p className="text-sm text-gray-600">Evento ativo: <strong>{eventId || "—"}</strong></p>
      </header>

      <section className="card p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm">Equipe:</label>
          <select
            className="border rounded-md px-2 py-1"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecione uma equipe…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {teams.length === 0 ? "Sem equipes cadastradas." : "Selecione uma equipe para iniciar a marcação."}
        </div>
      </section>
    </main>
  );
}
