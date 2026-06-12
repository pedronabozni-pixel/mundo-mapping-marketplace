// Auth + tier para as rotas da base de creators (server-only).
//
// REGRA DE OURO: o gating por plano acontece AQUI, no servidor. As rotas
// selecionam apenas colunas nomeadas permitidas para o tier — esconder campo
// no front nunca é mecanismo de gating.

import { createClient } from "@/lib/supabase/server";
import { getTierCreators, type TierCreators } from "@/lib/plano-creators";

export type CreatorsSession = {
  userId: string;
  tier: TierCreators;
};

export type GateResult =
  | { ok: true; session: CreatorsSession }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Exige sessão da área da empresa (mesmos user_types aceitos pelo layout de
 * /mundo-mapping/afiliados: empresa, admin ou null = cadastro novo) e resolve
 * o tier a partir de profiles.plano.
 */
export async function requireEmpresaCreatorsSession(): Promise<GateResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, plano")
    .eq("id", user.id)
    .maybeSingle();

  const userType = profile?.user_type ?? null;
  if (userType && userType !== "empresa" && userType !== "admin") {
    return { ok: false, status: 403, error: "not_empresa" };
  }

  return { ok: true, session: { userId: user.id, tier: getTierCreators(profile) } };
}

/** Convites registrados pela empresa nas últimas 24h (janela móvel). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function contarConvites24h(admin: any, empresaId: string): Promise<number> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("convites_creators")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .gte("criado_em", desde);
  return count ?? 0;
}
