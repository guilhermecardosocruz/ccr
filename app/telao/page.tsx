"use client";

import { useEffect, useState, useMemo } from "react";
import { getSession } from "@/lib/session";
import { listRuns } from "@/lib/events";
import { Run, compute } from "@/lib/ranking";

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export default function TelaoPage() {
  const sess = getSession();
  const eventId = sess.eventId;

  const [runs, setRuns] = useState<Run[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isTelãoActive, setIsTelãoActive] = useState(true); // Telão ativo
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (eventId) listRuns(eventId).then(setRuns);

    // Carregar imagens para o telão
    setImages([
      "/images/image1.jpg",
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
    <main className="container-page w-full h-screen bg-black text-white flex items-center justify-center">
      {isTelãoActive ? (
        <div className="telão w-full h-full flex justify-center items-center">
          {showImage ? (
            <img src={images[imageIndex]} alt={`Imagem ${imageIndex + 1}`} className="w-full h-full object-cover" />
          ) : (
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
                    <td colSpan={4} className="px-2 py-8 text-center text-gray-500">
                      Sem rodadas salvas.
                    </td>
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
          )}
        </div>
      ) : (
        <div className="text-center text-xl font-bold">Telão desativado</div>
      )}
    </main>
  );
}
