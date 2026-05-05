"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Plan = "associate" | "partner" | "elite";

const PLAN_LABEL: Record<Plan, string> = {
  associate: "Associate",
  partner: "Partner",
  elite: "Elite",
};

const PLAN_DESC: Record<Plan, string> = {
  associate: "Acesse produtos disponíveis no marketplace e comece a vender por comissão",
  partner: "Dashboard completo com performance detalhada e curadoria automática por nicho",
  elite: "Curadoria humana, materiais personalizados e account manager dedicado",
};

export function InfluenciadorPlanBanner() {
  const [plan, setPlan] = useState<Plan>("associate");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user.id)
        .single();

      if (data?.plano) setPlan(data.plano as Plan);
      setLoaded(true);
    }
    fetchProfile();
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/80 bg-white px-6 py-3">
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
        Plano {PLAN_LABEL[plan]}
      </span>
      <span className="text-sm text-zinc-500">{PLAN_DESC[plan]}</span>
    </div>
  );
}
