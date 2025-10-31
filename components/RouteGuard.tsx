"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { useRouter } from "next/navigation";

type Need = "any" | "admin" | "judge" | "coord" | "judge_or_coord";

function hasPermission(role: "admin"|"judge"|"coord"|null, need: Need) {
  if (need === "any") return true;
  if (role === "admin") return true; // admin vê tudo (superusuário)
  if (!role) return false;
  if (need === "judge_or_coord") return role === "judge" || role === "coord";
  return role === need;
}

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
    if (!s.authed || !s.role) {
      router.replace("/login");
      return;
    }

    if (!hasPermission(s.role, need)) {
      // redireciona para a melhor página disponível
      if (s.role === "admin") router.replace("/gestor");
      else router.replace("/planilha");
      return;
    }

    if (needEvent && !s.eventId) {
      // sem evento ativo, volta ao gestor para escolher/ativar
      router.replace("/gestor");
      return;
    }

    setOk(true);
  }, [router, need, needEvent]);

  if (!ok) return null;
  return <>{children}</>;
}
