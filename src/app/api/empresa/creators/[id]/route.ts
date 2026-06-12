import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmpresaCreatorsSession } from "@/lib/creators-gate";

export const dynamic = "force-dynamic";

// Colunas SEMPRE nomeadas — nunca select("*").
// NUNCA saem (nenhum tier): email, email_normalizado, celular,
// asaas_customer_id, asaas_wallet_id, legacy_id.
const DETAIL_FIELDS_PAGO =
  "id, nome, bio, cidade, estado, rede_principal, instagram_seguidores, tiktok_seguidores, youtube_inscritos, taxa_engajamento, ativado";
// Elite: + handles das redes (apenas no detalhe).
const DETAIL_FIELDS_ELITE = `${DETAIL_FIELDS_PAGO}, instagram, tiktok, youtube`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireEmpresaCreatorsSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { tier } = gate.session;

  // Free não acessa perfil individual.
  if (tier === "free") {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
  }

  const { id } = await params;
  const fields = tier === "elite" ? DETAIL_FIELDS_ELITE : DETAIL_FIELDS_PAGO;

  const { data, error } = await createAdminClient()
    .from("creators_legado")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ tier, creator: data });
}
