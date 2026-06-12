"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProductStore } from "./product-store";

export type Plan = "associate" | "partner" | "elite";

export const PLAN_LIMITS: Record<Plan, number | null> = {
  associate: 1,
  partner: 10,
  elite: 50,
};

export const PLAN_LABEL: Record<Plan, string> = {
  associate: "Associate",
  partner: "Partner",
  elite: "Elite",
};

export function usePlanLimits() {
  const { products } = useProductStore();
  const [plan, setPlan] = useState<Plan>("associate");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
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
    fetchPlan();
  }, []);

  const limit = PLAN_LIMITS[plan];
  const productCount = products.length;
  const atLimit = limit !== null && productCount >= limit;

  return { plan, planLabel: PLAN_LABEL[plan], limit, productCount, atLimit, loaded };
}
