"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { listRuns } from "@/lib/events";
import { Run, compute } from "@/lib/ranking";

const mmss = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export default function TelaoPage() {
  const sess = getSession();
  const eventId = sess.eventId;

  const [runs, setRuns] = useState<Run[]>([]);
  const [images, setImages] = useState<string[]>([
    // coloque suas imagens em /public/gallery e liste aqui:
    "/gallery/1.jpg",
    "/gallery/2.jpg",
    "/gallery/3.jpg",
  ]);
  const [imgIdx, setImgIdx] = useState(0);
  const [showImages, setShowImages] = useState(false); // alterna entre placar e imagens

  // Esconde qualquer menu/topbar/header quando o telão está aberto
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-hide-chrome", "true");
    style.innerHTML = `
      /* esconder cromos do app */
      header, nav, .topbar, [data-appmenu], .app-menu, .menu, .site-header { display: none !important; }
      /* ocupar a tela toda em branco e sem rolagem */
      html, body { background: #fff !important; overscroll-behavior: none; }
      body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
      /* neutralizar paddings do container do app */
      .container-page { padding: 0 !important; max-width: 100vw !important; }
    `;
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch {} };
  }, []);

  // Carregar rodadas
  useEffect(() => {
    if (eventId) listRuns(eventId).then(setRuns);
  }, [eventId]);

  // Recarregar periodicamente (telão precisa estar “vivo”)
  useEffect(() => {
    const id = setInterval(() => {
      if (eventId) listRuns(eventId).then(setRuns);
    }, 4000);
    return () => clearInterval(id);
  }, [eventId]);

  // Alternar entre placar e imagens a cada 1 segundo
  useEffect(() => {
    const id = setInterval(() => {
      setShowImages((v) => !v);
      setImgIdx((i) => (i + 1) % Math.max(1, images.length));
    }, 1000);
    return () => clearInterval(id);
  }, [images.length]);

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

  return (
    <main
      className="w-screen h-screen bg-white text-black"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* MOSTRAR IMAGENS EM TELA CHEIA */}
      {showImages ? (
        <img
          src={images[imgIdx]}
          alt="Imagem do evento"
          style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
        />
      ) : (
        /* PLACAR EM FUNDO BRANCO, CENTRALIZADO E ENXUTO */
        <div className="w-[95vw] max-w-[1200px]">
          <table className="w-full text-[clamp(12px,2.5vw,18px)]">
            <thead>
              <tr className="text-left border-b">
                <th className="py-3 pr-3">#</th>
                <th className="py-3 pr-3">Equipe</th>
                <th className="py-3 pr-3">Ranking (2 melhores)</th>
                <th className="py-3">Tempo (2 melhores)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500">
                    Sem rodadas salvas.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.team} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-semibold">{i + 1}</td>
                    <td className="py-3 pr-3">{r.team}</td>
                    <td className="py-3 pr-3 font-semibold">{r.rankingScore.toFixed(2)}</td>
                    <td className="py-3">{mmss(r.tieTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
