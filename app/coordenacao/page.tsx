"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams, addTeam, renameTeam, deleteTeam } from "@/lib/events";

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
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<number | null>(null);
  const [val, setVal] = useState("");

  async function refresh() {
    const rows = await listTeams(eventId);
    setTeams(rows);
  }

  useEffect(() => {
    refresh();
  }, [eventId]);

  async function add() {
    const n = name.trim();
    if (!n || teams.some((t) => t.name === n)) return;
    await addTeam(eventId, n);
    setName(""); 
    await refresh();
  }

  async function rm(i: number) {
    await deleteTeam(eventId, teams[i].name);
    await refresh();
  }

  function start(i: number) {
    setEdit(i);
    setVal(teams[i].name);
  }

  async function save() {
    if (edit === null) return;
    const v = val.trim();
    if (!v) return;
    await renameTeam(eventId, teams[edit].name, v);
    setEdit(null);
    setVal("");
    await refresh();
  }

  return (
    <main className="container-page space-y-6">
      <header className="card p-4">
        <h1 className="text-lg font-semibold mb-2">Equipes</h1>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            placeholder="Nome da equipe"
          />
          <button onClick={add} className="px-3 py-2 border rounded-md">
            Adicionar
          </button>
        </div>
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
                  <td className="px-3 py-2">
                    {edit === i ? (
                      <input
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="border rounded-md px-2 py-1 w-full"
                      />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    {edit === i ? (
                      <>
                        <button onClick={save} className="px-2 py-1 border rounded-md">
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEdit(null);
                            setVal("");
                          }}
                          className="px-2 py-1 border rounded-md"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => start(i)}
                          className="px-2 py-1 border rounded-md"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => rm(i)}
                          className="px-2 py-1 border rounded-md"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
