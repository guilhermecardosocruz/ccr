"use client";

import { useEffect, useState } from "react";
import { getSession, setSession } from "@/lib/session";
import { useRouter } from "next/navigation";

type Need = "any" | "admin" | "judge" | "coord" | "judge_or_coord";

export default function RouteGuard({
  need,
  needEvent = false,
  children,
}: {
  need: Need;
  needEvent?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const s = getSession();

    // 1) Autenticação básica
    if (!s.authed || !s.role) {
      router.replace("/login");
      return;
    }

    // 2) Permissão por role
    const allowed =
      need === "any"
        ? true
        : need === "judge_or_coord"
        ? s.role === "judge" || s.role === "coord"
        : s.role === need;

    if (!allowed) {
      // Admin sempre vai para /gestor
      if (s.role === "admin") {
        router.replace("/gestor");
        return;
      }
      // Juiz/Coord sem permissão específica => leva para planilha
      if (s.role === "judge" || s.role === "coord") {
        router.replace("/planilha");
        return;
      }
      return;
    }

    // 3) Garantir eventId quando necessário (pega da URL se não houver na sessão)
    if (needEvent && !s.eventId) {
      try {
        const q = new URLSearchParams(window.location.search);
        const id = q.get("eventId");
        if (id) {
          setSession({ ...s, eventId: id });
        } else {
          // Sem eventId -> volta ao gestor (admin) ou login (demais)
          if (s.role === "admin") router.replace("/gestor");
          else router.replace("/login");
          return;
        }
      } catch {
        if (s.role === "admin") router.replace("/gestor");
        else router.replace("/login");
        return;
      }
    }

    setOk(true);
  }, [router, need, needEvent]);

  if (!ok) return null;
  return <>{children}</>;
}
