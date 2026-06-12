// Tier de acesso à base de creators, derivado do plano da empresa.
// Segue o padrão do restante do app (use-plan-limits): o gate olha apenas
// profiles.plano — "associate" (ou ausência de plano) é o tier gratuito.
export type TierCreators = "free" | "pago" | "elite";

// Limite diário de convites por empresa (janela móvel de 24h, server-side).
export const LIMITE_CONVITES_DIA = 10;

export function getTierCreators(profile: { plano?: string | null } | null | undefined): TierCreators {
  if (profile?.plano === "elite") return "elite";
  if (profile?.plano === "partner") return "pago";
  return "free";
}

// Gating do modo de afiliação: só plano pago pode exigir aprovação manual.
// Empresa associate/sem plano tem produtos sempre abertos (automatic).
// Espelha o trigger force_automatic_for_free_plan do banco (fonte da verdade).
export function podeExigirAprovacao(plano: string | null | undefined): boolean {
  return plano === "partner" || plano === "elite";
}

// Checkout/link externo próprio (Hotmart, site da empresa etc.) é exclusivo
// do Elite. Associate e Partner vendem pelo checkout interno da Mapping.
export function podeUsarLinkExterno(plano: string | null | undefined): boolean {
  return plano === "elite";
}
