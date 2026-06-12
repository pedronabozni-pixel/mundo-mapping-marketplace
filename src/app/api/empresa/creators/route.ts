import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmpresaCreatorsSession, contarConvites24h } from "@/lib/creators-gate";
import { LIMITE_CONVITES_DIA } from "@/lib/plano-creators";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

// Colunas SEMPRE nomeadas — nunca select("*").
// Campos que NUNCA saem por esta rota (nenhum tier): email, email_normalizado,
// celular, asaas_customer_id, asaas_wallet_id, legacy_id.
// Handles (instagram/tiktok/youtube) não saem na LISTAGEM nem para Elite —
// só no detalhe, para Elite.
const LIST_FIELDS =
  "id, nome, cidade, estado, rede_principal, instagram_seguidores, tiktok_seguidores, youtube_inscritos, taxa_engajamento, ativado";

const REDE_COLUMN: Record<string, string> = {
  instagram: "instagram_seguidores",
  tiktok: "tiktok_seguidores",
  youtube: "youtube_inscritos",
};

const AUDIENCE_COLUMNS = ["instagram_seguidores", "tiktok_seguidores", "youtube_inscritos"];

export async function GET(req: NextRequest) {
  const gate = await requireEmpresaCreatorsSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { tier } = gate.session;

  const admin = createAdminClient();

  // ── FREE: só o total. Zero registros — o teaser do front usa placeholders
  // fictícios, nunca dados reais. ─────────────────────────────────────────────
  if (tier === "free") {
    const { count, error } = await admin
      .from("creators_legado")
      .select("id", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({ error: "internal" }, { status: 500 });
    }
    return NextResponse.json({ tier, total: count ?? 0 });
  }

  // ── PAGO / ELITE ────────────────────────────────────────────────────────────
  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const q = (params.get("q") ?? "").trim();

  let query = admin
    .from("creators_legado")
    .select(LIST_FIELDS, { count: "exact" });

  // Busca por nome: disponível para pago e elite.
  if (q) {
    // escapa curingas do ilike para busca literal
    const safe = q.replace(/[%_]/g, "\\$&");
    query = query.ilike("nome", `%${safe}%`);
  }

  // Filtros avançados: SÓ Elite. Para os demais tiers os parâmetros são
  // IGNORADOS no servidor (não aplicados), conforme o modelo de negócio.
  if (tier === "elite") {
    const estado = (params.get("estado") ?? "").trim();
    const cidade = (params.get("cidade") ?? "").trim();
    const rede = (params.get("rede") ?? "").trim().toLowerCase();
    const minSeg = parseInt(params.get("min_seguidores") ?? "", 10);
    const maxSeg = parseInt(params.get("max_seguidores") ?? "", 10);

    if (estado) query = query.ilike("estado", estado);
    if (cidade) {
      const safeCidade = cidade.replace(/[%_]/g, "\\$&");
      query = query.ilike("cidade", `%${safeCidade}%`);
    }

    const redeCol = REDE_COLUMN[rede];
    if (redeCol) {
      query = query.gt(redeCol, 0);
      if (Number.isFinite(minSeg)) query = query.gte(redeCol, minSeg);
      if (Number.isFinite(maxSeg)) query = query.lte(redeCol, maxSeg);
    } else {
      // Sem rede selecionada: min/max sobre a maior audiência entre as redes.
      // greatest >= min  <=>  alguma rede >= min
      if (Number.isFinite(minSeg)) {
        query = query.or(AUDIENCE_COLUMNS.map((c) => `${c}.gte.${minSeg}`).join(","));
      }
      // greatest <= max  <=>  todas as redes <= max (null tratado como 0)
      if (Number.isFinite(maxSeg)) {
        for (const c of AUDIENCE_COLUMNS) {
          query = query.or(`${c}.lte.${maxSeg},${c}.is.null`);
        }
      }
    }
  }

  // Ordenação: maior audiência primeiro. PostgREST não ordena por expressão
  // (greatest), então ordenamos pelas redes em cascata, nulls no fim — a rede
  // dominante da base é o Instagram, o que aproxima bem o "greatest".
  const from = (page - 1) * PER_PAGE;
  const { data, count, error } = await query
    .order("instagram_seguidores", { ascending: false, nullsFirst: false })
    .order("tiktok_seguidores", { ascending: false, nullsFirst: false })
    .order("youtube_inscritos", { ascending: false, nullsFirst: false })
    .range(from, from + PER_PAGE - 1);

  if (error) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // Elite vê o saldo do limite diário de convites (a checagem que vale é a da
  // rota de convite; aqui é informativo para o chip da vitrine).
  let convitesRestantesHoje: number | undefined;
  if (tier === "elite") {
    const usados = await contarConvites24h(admin, gate.session.userId);
    convitesRestantesHoje = Math.max(0, LIMITE_CONVITES_DIA - usados);
  }

  return NextResponse.json({
    tier,
    total: count ?? 0,
    page,
    per_page: PER_PAGE,
    creators: data ?? [],
    ...(convitesRestantesHoje !== undefined
      ? { convites_restantes_hoje: convitesRestantesHoje, limite_convites_dia: LIMITE_CONVITES_DIA }
      : {}),
  });
}
