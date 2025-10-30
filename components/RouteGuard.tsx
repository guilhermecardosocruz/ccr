"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function RouteGuard({ need, needEvent = false, children }:{
  need: "any"|"admin"|"judge"|"coord"|"judge_or_coord",
  needEvent?: boolean,
  children: React.ReactNode
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s.authed || !s.role) {
      router.replace("/login");
      return;
    }

    // Checa se o papel do usuário é válido
    if (need !== "any" && s.role !== need) {
      if (s.role === "admin") {
        router.replace("/gestor");
      } else if (s.role === "judge" || s.role === "coord") {
        router.replace("/planilha"); // Para juiz ou coordenador
      }
      return;
    }

    // Verifica se o evento foi selecionado
    if (needEvent && !s.eventId) {
      router.replace("/gestor");
      return;
    }

    setOk(true);
  }, [router, need, needEvent]);

  if (!ok) return null;
  return <>{children}</>;
}
