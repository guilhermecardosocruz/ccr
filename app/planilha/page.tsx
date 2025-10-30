"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams, addRun } from "@/lib/events";

const MARKERS = [1, 2] as const;
const ATTEMPTS = [1, 2, 3] as const;

type Marker = (typeof MARKERS)[number];   
type Attempt = (typeof ATTEMPTS)[number]; 

const DESAFIOS: Record<string, { title: string; points: number; rows: number }> = {
  lombadas: { title: "Lombadas (15)", points: 15, rows: 5 },
  gap: { title: "Gap (15)", points: 15, rows: 5 },
  obstaculo: { title: "Obstáculo (20)", points: 20, rows: 5 },
};

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

  const [durationMin, setDurationMin] = useState(5);
  const [timeLeft, setTimeLeft] = useState(durationMin * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) setTimeLeft(durationMin * 60);
  }, [durationMin, running]);

  const startPause = () => {
    if (!selected) return;
    if (timeLeft <= 0) setTimeLeft(durationMin * 60);
    setRunning((r) => !r);
  };

  const penalty = () => running && selected && setTimeLeft((t) => Math.max(0, t - 60));

  const canStart = !!selected || running;
  const resetAll = () => {
    setSelected("");
    setTimeLeft(durationMin * 60);
    setRunning(false);
  };

  return (
    <div className="planilha-container">
      {/* Your Planilha UI */}
    </div>
  );
}
