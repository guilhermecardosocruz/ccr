"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams, addRun } from "@/lib/events";

export default function Page() {
  return (
    <RouteGuard need="judge_or_coord" needEvent>
      <Planilha />
    </RouteGuard>
  );
}

function Planilha() {
  const sess = getSession();
  const eventId = sess.eventId!;
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    listTeams(eventId).then(setTeams);
  }, [eventId]);

  // Cronômetro, placar e lógica adicional...

  return (
    <main className="container-page space-y-6">
      {/* UI do cronômetro, pontuação e tabelas */}
    </main>
  );
}
