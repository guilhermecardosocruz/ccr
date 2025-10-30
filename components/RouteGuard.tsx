"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
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

    // Verifica se está logado
    if (!s.authed || !s.role) {
      router.replace("/login");
      return;
    }

    // Verifica a permissão de role
    const allowed =
      need === "any" ||
      (need === "judge_or_coord" && (s.role === "judge" || s.role === "coord")) ||
      s.role === need;

    if (!allowed) {
      if (s.role === "admin") router.replace("/gestor");
      else router.replace("/planilha");
      return;
    }

    // Verifica se o evento está ativo (necessário para juiz e coordenação)
    if (needEvent && !s.eventId) {
      router.replace(s.role === "admin" ? "/gestor" : "/login");
      return;
    }

    setOk(true);
  }, [router, need, needEvent]);

  if (!ok) return null;
  return <>{children}</>;
}
