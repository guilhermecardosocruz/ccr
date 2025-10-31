"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listRuns } from "@/lib/events";
import { Run, compute } from "@/lib/ranking";
import Link from "next/link"; // Importando o Link para navegação

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export default function ResultadoPage() {
  const sess = getSession();
  const eventId = sess.eventId;
  const [runs, setRuns] = useState<Run[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isTelãoActive, setIsTelãoActive] = useState(false); // Controla a exibição do telão
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (eventId) listRuns(eventId).then(setRuns);

    // Carregar imagens para o telão
    setImages([
      "/images/image1.jpg", // Exemplo de imagens
      "/images/image2.jpg",
      "/images/image3.jpg",
    ]);
  }, [eventId]);

  const byTeam = useMemo(() => {
    const m = new Map<string, Run[]>();
    for (const r of runs) {
      if (!m.has(r.team)) m.set(r.team, []);
      m.get(r.team)!.push(r);
    }
    for (const a of m.values()) a.sort((x, y) => x.at - y.at);
    return m;
  }, [runs]);

  const rows = useMemo(() => compute(byTeam), [byTeam]);

  // Alternar entre o placar e as imagens a cada 10 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      setShowImage(!showImage);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [showImage, images.length]);

  return (
    <main className="container-page max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Copa Criciúma de Robótica</h1>
          <p className="text-sm text-gray-500">Ranking — 2 melhores; desempate por soma total e menor tempo.</p>
        </div>
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg border flex items-center justify-center text-xs text-gray-500 bg-white">LOGO</div>
      </header>

      {/* Botão para ir à Galeria */}
      <section className="card p-3 md:p-5">
        <div className="flex gap-4">
          <Link href="/galeria">
            <button className="px-3 py-2 border rounded-md bg-blue-500 text-white">
              Ir para Galeria
            </button>
          </Link>
        </div>
      </section>

      {/* Botão para ir ao Telão */}
      <section className="card p-3 md:p-5">
        <div className="flex gap-4">
          <Link href="/telao">
            <button className="px-3 py-2 border rounded-md bg-blue-500 text-white">
              Ir para Telão
            </button>
          </Link>
        </div>
      </section>

      {/* Ranking Detalhado */}
      <section className="card p-3 md:p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Equipe</th>
                <th className="px-2 py-2">Ranking (2 melhores)</th>
                <th className="px-2 py-2">Tempo (2 melhores)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-gray-500">Sem rodadas salvas.</td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.team} className={i % 2 ? "bg-white" : "bg-gray-50/60"}>
                    <td className="px-2 py-2 font-semibold">{i + 1}</td>
                    <td className="px-2 py-2">{r.team}</td>
                    <td className="px-2 py-2 font-semibold">{r.rankingScore.toFixed(2)}</td>
                    <td className="px-2 py-2">{mmss(r.tieTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
