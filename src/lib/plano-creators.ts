// Tier de acesso à base de creators, derivado do plano da empresa.
// Segue o padrão do restante do app (use-plan-limits): o gate olha apenas
// profiles.plano — "associate" (ou ausência de plano) é o tier gratuito.
export type TierCreators = "free" | "pago" | "elite";

export function getTierCreators(profile: { plano?: string | null } | null | undefined): TierCreators {
  if (profile?.plano === "elite") return "elite";
  if (profile?.plano === "partner") return "pago";
  return "free";
}
