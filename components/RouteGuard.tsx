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

  useEffect(()=>{
    const s = getSession();
    if (!s.authed || !s.role) {
      router.replace("/login");
      return;
    }

    // Redirecionamento para o Gestor caso não tenha permissão
    if (need !== "any" && s.role !== need) {
      if (s.role === "admin") {
        router.replace("/gestor");
      } else if (s.role === "judge" || s.role === "coord") {
        router.replace("/planilha"); // Redireciona para planilha se for juiz ou coordenador
      }
      return;
    }

    // Verificação de evento
    if (needEvent && !s.eventId) {
      router.replace("/gestor");
      return;
    }

    setOk(true);
  }, [router, need, needEvent]);

  if (!ok) return null;
  return <>{children}</>;
}
