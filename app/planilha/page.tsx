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
  const eventId = sess.eventId;

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!eventId) {
      alert("Evento não encontrado.");
      return;
    }
    listTeams(eventId).then(setTeams);
  }, [eventId]);

  return (
    <div className="planilha-container">
      {/* Your Planilha UI */}
    </div>
  );
}
