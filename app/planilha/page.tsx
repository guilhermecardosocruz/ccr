"use client";

import RouteGuard from "@/components/RouteGuard";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listTeams, addRun } from "@/lib/events";

/** Constantes tipadas como literais */
const MARKERS = [1, 2] as const;
const ATTEMPTS = [1, 2, 3] as const;

type Marker = (typeof MARKERS)[number];   // 1 | 2
type Attempt = (typeof ATTEMPTS)[number]; // 1 | 2 | 3

/** Config */
type DKey = "lombadas" | "gap" | "obstaculo" | "intercepcao" | "chegada" | "fato";
const DESAFIOS: Record<DKey, { title: string; points: number; rows: number }> = {
  lombadas: { title: "Lombadas (15)", points: 15, rows: 5 },
  gap: { title: "Gap (15)", points: 15, rows: 5 },
  obstaculo: { title: "Obstáculo (20)", points: 20, rows: 5 },
  intercepcao: { title: "Intercepção (20)", points: 20, rows: 5 },
  chegada: { title: "Chegada (50)", points: 50, rows: 5 }, // Alterado para 50 pontos
  fato: { title: "Fato Histórico (50)", points: 50, rows: 5 },
} as const;

const MARC = { 1: 100, 2: 75, 3: 50 } as const;
const MINA = { 1: 1.5, 2: 1.25, 3: 1.15 } as const;

const makeState = () =>
  Object.fromEntries(
    (Object.keys(DESAFIOS) as DKey[]).map((k) => [k, Array(DESAFIOS[k].rows).fill(false)])
  ) as Record<DKey, boolean[]>;

const mmss = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export default function Page() {
  return (
    <RouteGuard need="judge_or_coord" needEvent>
      <Planilha />
    </RouteGuard>
  );
}

function Planilha() {
  const sess = getSession();
  const eventId =
    sess.eventId ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("eventId") || ""
      : "");

  /** Equipes */
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (!eventId) return;
    listTeams(eventId).then(setTeams).catch(() => setTeams([]));
  }, [eventId]);

  /** Cronômetro */
  const [durationMin, setDurationMin] = useState(5);
  const [timeLeft, setTimeLeft] = useState(durationMin * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) setTimeLeft(durationMin * 60);
  }, [durationMin, running]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const canStart = !!selected || running;
  const startPause = () => {
    if (!selected) return;
    if (timeLeft <= 0) setTimeLeft(durationMin * 60);
    setRunning((r) => !r);
  };
  const penalty = () =>
    running && selected && setTimeLeft((t) => Math.max(0, t - 60));

  /** Placar */
  const [tab, setTab] = useState(makeState());
  const [mark, setMark] = useState<Record<Attempt, 0 | 1 | 2>>({ 1: 0, 2: 0, 3: 0 });
  const [mina, setMina] = useState<0 | Attempt>(0);
  const canScore = Boolean(selected) && running && timeLeft > 0;

  const toggle = (d: DKey, i: number) => {
    if (!canScore) return;
    setTab((p) => {
      const n = { ...p };
      n[d] = [...n[d]];
      n[d][i] = !n[d][i];
      return n;
    });
  };

  const pick = (t: Attempt, q: 0 | 1 | 2) => {
    if (!canScore) return;
    setMark((p) => {
      // Ajuste para garantir que apenas uma seleção por coluna seja permitida
      const newMark = { ...p, [t]: q }; 
      
      // Limpa as tentativas anteriores da mesma coluna
      if (t === 1) newMark[2] = 0; // Desmarca a tentativa 2 quando a tentativa 1 for marcada
      if (t === 2) newMark[1] = 0; // Desmarca a tentativa 1 quando a tentativa 2 for marcada
      return newMark;
    });
  };

  const somaCol: Record<DKey, number> = useMemo(() => {
    const r: Partial<Record<DKey, number>> = {};
    (Object.keys(DESAFIOS) as DKey[]).forEach((k) => {
      r[k] = tab[k].reduce((a, on) => a + (on ? DESAFIOS[k].points : 0), 0);
    });
    return r as Record<DKey, number>;
  }, [tab]);

  const somaDes = (Object.keys(DESAFIOS) as DKey[]).reduce((a, k) => a + somaCol[k], 0);
  const somaMar = ATTEMPTS.reduce((a, t) => a + (mark[t] ? MARC[t] : 0), 0);
  const mult = mina === 0 ? 1 : MINA[mina];
  const total = Number(((somaDes + somaMar) * mult).toFixed(2));

  function resetAll() {
    setTab(makeState());
    setMark({ 1: 0, 2: 0, 3: 0 });
    setMina(0);
    setRunning(false);
    setTimeLeft(durationMin * 60);
    setSelected("");
  }

  /** salvar rodada (máx 3 por equipe; salva tempo pausado) */
  async function saveRound() {
    if (!selected) {
      alert("Selecione uma equipe.");
      return;
    }
    if (!eventId) {
      alert("Evento inválido.");
      return;
    }
    const elapsed = durationMin * 60 - timeLeft;
    await addRun(eventId, selected, total, Math.max(0, elapsed));
    alert(
      `Rodada salva!\nEquipe: ${selected}\nPontuação: ${total}\nTempo: ${mmss(Math.max(0, elapsed))}`
    );
  }

  const cellCls = (on: boolean) =>
    `cell-btn ${on ? "is-on" : "is-off"} ${canScore ? "" : "opacity-50 cursor-not-allowed"}`;
  const maxRows = Math.max(
    ...Object.values(DESAFIOS).map((v) => v.rows)
  ); // Corrigido para garantir que maxRows não quebre

  return (
    <main className="container-page space-y-6">
      <header className="card p-3 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">EQUIPE:</label>
            <select
              className="px-3 py-1.5 border rounded-md bg-white"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Selecione</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="px-2 py-1.5 border rounded-md bg-white"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              disabled={running}
              title={running ? "Pause para alterar" : "Selecione a duração"}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <div className="text-3xl font-mono">{mmss(timeLeft)}</div>
            <button
              onClick={startPause}
              className={`px-3 py-2 border rounded-md ${!canStart ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!canStart}
            >
              {running ? "Pausar" : timeLeft <= 0 ? "Reiniciar" : "Iniciar"}
            </button>
            <button
              onClick={penalty}
              disabled={!running || timeLeft <= 0 || !selected}
              className={`px-3 py-2 border rounded-md ${
                running && timeLeft > 0 && selected ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
              }`}
            >
              Penalidade -1:00
            </button>
            <button onClick={resetAll} className="px-3 py-2 border rounded-md">
              Zerar
            </button>
            <button onClick={saveRound} className="px-3 py-2 border rounded-md bg-gray-900 text-white">
              Salvar resultado
            </button>
          </div>
        </div>
        {!selected ? (
          <p className="mt-3 text-xs text-red-600">Selecione uma equipe para iniciar o tempo e liberar a pontuação.</p>
        ) : (
          <p className="mt-3 text-xs text-gray-500">Pontuações só podem ser marcadas com o cronômetro em andamento.</p>
        )}
      </header>

      {/* Desafios */}
      <section className="card p-3 md:p-5">
        <h2 className="mb-3 grid-head">DESAFIOS DE PISTA</h2>
        <div className="sheet">
          <table>
            <thead>
              <tr>
                <th className="w-28"></th>
                {(Object.keys(DESAFIOS) as DKey[]).map((k) => (
                  <th key={k}>{DESAFIOS[k].title}</th>
                ))}
                <th className="w-28">SOMA</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, r) => (
                <tr key={r}>
                  <td></td>
                  {(Object.keys(DESAFIOS) as DKey[]).map((k) => {
                    const cfg = DESAFIOS[k];
                    const exists = r < cfg.rows;
                    const on = exists ? tab[k][r] : false;
                    return (
                      <td key={k + String(r)}>
                        {exists ? (
                          <button
                            className={cellCls(on)}
                            onClick={() => toggle(k, r)}
                            disabled={!canScore}
                            title={`${cfg.points} pontos`}
                          >
                            {on ? cfg.points : ""}
                          </button>
                        ) : (
                          <div className="cell-btn" />
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <div className="cell-btn" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>SOMA</th>
                {(Object.keys(DESAFIOS) as DKey[]).map((k) => (
                  <td key={"s" + k} className="summary">
                    {somaCol[k]}
                  </td>
                ))}
                <td className="summary">{somaDes}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Marcadores */}
      <section className="card p-3 md:p-5">
        <h2 className="mb-3 grid-head">MARCADORES</h2>
        <div className="sheet">
          <table>
            <thead>
              <tr>
                <th>Marcador</th>
                <th>Tentativa 1 (100)</th>
                <th>Tentativa 2 (75)</th>
                <th>Tentativa 3 (50)</th>
                <th>SOMA</th>
              </tr>
            </thead>
            <tbody>
              {MARKERS.map((m) => (
                <tr key={"m" + m}>
                  <td className="font-medium">{`Marcador ${m}`}</td>
                  {ATTEMPTS.map((t) => {
                    const ativo = mark[t] === m;
                    return (
                      <td key={`m${m}t${t}`}>
                        <button
                          className={`cell-btn ${ativo ? "is-on" : "is-off"} ${
                            canScore ? "" : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => pick(t, ativo ? 0 : m)}
                          disabled={!canScore}
                        >
                          {ativo ? MARC[t] : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td>
                    <div className="cell-btn"></div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>SOMA</th>
                <td className="summary">{mark[1] ? 100 : 0}</td>
                <td className="summary">{mark[2] ? 75 : 0}</td>
                <td className="summary">{mark[3] ? 50 : 0}</td>
                <td className="summary">
                  {ATTEMPTS.reduce((a, t) => a + (mark[t] ? MARC[t] : 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Mina */}
      <section className="card p-3 md:p-5">
        <h2 className="mb-3 grid-head">MINA</h2>
        <div className="sheet">
          <table>
            <thead>
              <tr>
                <th>Mina</th>
                <th>Tentativa 1 (1,5x)</th>
                <th>Tentativa 2 (1,25x)</th>
                <th>Tentativa 3 (1,15x)</th>
                <th>Multiplicador</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Mina</td>
                {ATTEMPTS.map((t) => {
                  const ativo = mina === t;
                  return (
                    <td key={`mina${t}`}>
                      <button
                        className={`cell-btn ${ativo ? "is-on" : "is-off"}`}
                        onClick={() => setMina(ativo ? 0 : t)}
                      >
                        {MINA[t]}
                      </button>
                    </td>
                  );
                })}
                <td className="summary">× {mult}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Nota Final */}
      <section className="card p-3 md:p-5">
        <h2 className="mb-3 grid-head">Nota final (Obstáculos + Marcadores) × Mina</h2>
        <div className="sheet">
          <table>
            <thead>
              <tr>
                <th>DESAFIOS DE PISTA</th>
                <th>MARCADORES</th>
                <th>MINA</th>
                <th>RESULTADO FINAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="summary">{somaDes}</td>
                <td className="summary">{somaMar}</td>
                <td className="summary">{mult}</td>
                <td className="summary">{total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
