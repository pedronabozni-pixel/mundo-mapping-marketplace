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
  elite: 50,
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
      "Até 50 produtos",
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] p-8"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "#555" }}>Planos</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">Escolha seu plano</h3>
            <p className="mt-1 text-sm" style={{ color: "#888" }}>Quanto maior o plano, menor a taxa adicional sobre o Asaas.</p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
            onClick={onClose}
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#555" }}
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
                className="relative flex flex-col rounded-[20px] p-6"
                key={plan.id}
                style={
                  isCurrent
                    ? {
                        background: "linear-gradient(135deg, rgba(200,16,46,0.08) 0%, rgba(200,16,46,0.02) 60%, transparent 100%)",
                        border: "2px solid rgba(200,16,46,0.25)",
                      }
                    : {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }
                }
              >
                {isCurrent && (
                  <span className="absolute -top-3.5 left-5 rounded-full bg-[#C8102E] px-3 py-1 text-xs font-bold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)]">
                    Plano atual
                  </span>
                )}
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: isCurrent ? "#C8102E" : "#555" }}
                >
                  {plan.label}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm" style={{ color: "#666" }}>{plan.period}</span>}
                </div>
                <div
                  className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={
                    isCurrent
                      ? { background: "rgba(200,16,46,0.1)", color: "#C8102E" }
                      : { background: "rgba(255,255,255,0.04)", color: "#666" }
                  }
                >
                  {plan.fee}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li className="flex items-start gap-2.5 text-sm" key={feat} style={{ color: "#888" }}>
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: isCurrent ? "#C8102E" : "rgba(255,255,255,0.2)" }}
                      />
                      {feat}
                    </li>
                  ))}
                </ul>
                {!isCurrent && plan.id !== "associate" && (
                  <Link
                    className="mt-6 block w-full rounded-xl bg-[#C8102E] py-2.5 text-center text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)] transition hover:bg-[#A30D24]"
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
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
        style={{
          borderBottom: `1px solid ${atLimit ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)"}`,
          background: atLimit ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.015)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={
              atLimit
                ? { background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)" }
                : { background: "rgba(255,255,255,0.04)", color: "#888", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            Plano {PLAN_LABEL[plan]}
          </span>
          <span className="text-sm" style={{ color: atLimit ? "#FBBF24" : "#888", fontWeight: atLimit ? 600 : 400 }}>
            {`${productCount} de ${limit ?? 50} produto${(limit ?? 50) !== 1 ? "s" : ""} utilizado${(limit ?? 50) !== 1 ? "s" : ""}${atLimit ? " · Limite atingido" : ""}`}
          </span>
        </div>
        {plan !== "elite" && (
          <button
            className="inline-flex h-8 items-center justify-center rounded-xl bg-[#C8102E] px-4 text-xs font-bold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)] transition hover:bg-[#A30D24]"
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
