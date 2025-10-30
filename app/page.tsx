"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  useEffect(()=>{
    const s = getSession();
    if (!s.authed) router.replace("/login");
    else if (s.role==="admin") router.replace("/gestor");
    else router.replace("/planilha");
  },[router]);
  return null;
}
