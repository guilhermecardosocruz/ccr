"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams } from "@/lib/events";

export default function Page() {
  return (
    <RouteGuard need="coord" needEvent>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const sess = getSession();
  const eventId = sess.eventId!;

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!eventId) {
      alert("Evento não encontrado.");
      return;
    }
    listTeams(eventId).then(setTeams);
  }, [eventId]);

  return (
    <main className="container-page space-y-6">
      <header className="card p-4">
        <h1 className="text-lg font-semibold mb-2">Coordenação</h1>
      </header>
      <section className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Equipe</th>
              <th className="w-40 px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-500">
                  Nenhuma equipe.
                </td>
              </tr>
            ) : (
              teams.map((t, i) => (
                <tr key={t.id} className={i % 2 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">Ações aqui</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
