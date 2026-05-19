"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProductStore } from "@/components/mundo-mapping/product-store";
import { createClient } from "@/lib/supabase/client";

type Plan = "associate" | "partner" | "elite";

const PLAN_LABEL: Record<Plan, string> = {
  associate: "Associate",
  partner: "Partner",
  elite: "Elite",
};

const PLAN_LIMITS: Record<Plan, number | null> = {
  associate: 1,
  partner: 10,
  elite: null,
};

const plans = [
  {
    id: "associate" as Plan,
    label: "Associate",
    price: "Grátis",
    period: "",
    fee: "Taxa por venda: Asaas + 2%",
    features: [
      "1 produto no marketplace",
      "Acesso à base de +16k creators",
      "Link de afiliado básico",
    ],
  },
  {
    id: "partner" as Plan,
    label: "Partner",
    price: "R$117",
    period: "/mês",
    fee: "Taxa por venda: Asaas + R$0,99",
    features: [
      "Até 10 produtos no marketplace",
      "Dashboard de performance completo",
      "Curadoria automática por nicho",
      "Vê identidade dos creators afiliados",
      "Suporte via chat",
    ],
  },
  {
    id: "elite" as Plan,
    label: "Elite",
    price: "R$197",
    period: "/mês",
    fee: "Taxa por venda: Asaas + R$0,49",
    features: [
      "Tudo do Partner",
      "Produtos ilimitados",
      "Curadoria humana de creators",
      "Materiais de venda personalizados",
      "Account manager dedicado",
      "Relatórios avançados de GMV",
    ],
  },
];

export function UpgradeModal({
  currentPlan,
  onClose,
}: {
  currentPlan: Plan;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl overflow-auto rounded-[24px] border border-zinc-200 bg-white p-8 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.38)]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Planos</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Escolha seu plano</h3>
            <p className="mt-1 text-sm text-zinc-500">Quanto maior o plano, menor a taxa adicional sobre o Asaas.</p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                className={`relative flex flex-col rounded-[20px] p-6 ${
                  isCurrent
                    ? "border-2 border-red-200 bg-gradient-to-b from-red-50 via-white to-white"
                    : "border border-zinc-200 bg-white shadow-[0_18px_60px_-45px_rgba(24,24,27,0.22)]"
                }`}
                key={plan.id}
              >
                {isCurrent && (
                  <span className="absolute -top-3.5 left-5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)]">
                    Plano atual
                  </span>
                )}
                <p className={`text-xs font-bold uppercase tracking-widest ${isCurrent ? "text-red-700" : "text-zinc-400"}`}>
                  {plan.label}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-zinc-950">{plan.price}</span>
                  {plan.period && <span className="text-sm text-zinc-400">{plan.period}</span>}
                </div>
                <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${isCurrent ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {plan.fee}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li className="flex items-start gap-2.5 text-sm text-zinc-600" key={feat}>
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isCurrent ? "bg-red-600" : "bg-zinc-300"}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.id !== "associate" && (
                  <Link
                    className="mt-6 block w-full rounded-xl bg-red-600 py-2.5 text-center text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                    href={`/assinar/${plan.id}`}
                    onClick={onClose}
                  >
                    Assinar agora
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EmpresaPlanBanner() {
  const { products } = useProductStore();
  const [plan, setPlan] = useState<Plan>("associate");
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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

  const limit = PLAN_LIMITS[plan];
  const productCount = products.length;
  const atLimit = limit !== null && productCount >= limit;

  return (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3 ${atLimit ? "border-amber-200 bg-amber-50" : "border-zinc-200/80 bg-white"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${atLimit ? "bg-amber-100 text-amber-800 ring-amber-200" : "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
            Plano {PLAN_LABEL[plan]}
          </span>
          <span className={`text-sm ${atLimit ? "font-semibold text-amber-700" : "text-zinc-500"}`}>
            {limit === null
              ? "Produtos ilimitados"
              : `${productCount} de ${limit} produto${limit !== 1 ? "s" : ""} utilizado${limit !== 1 ? "s" : ""}${atLimit ? " · Limite atingido" : ""}`}
          </span>
        </div>
        {plan !== "elite" && (
          <button
            className="inline-flex h-8 items-center justify-center rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Fazer upgrade
          </button>
        )}
      </div>
      {modalOpen && <UpgradeModal currentPlan={plan} onClose={() => setModalOpen(false)} />}
    </>
  );
}
