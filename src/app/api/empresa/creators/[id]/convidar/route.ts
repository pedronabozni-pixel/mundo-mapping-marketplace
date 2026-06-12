import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmpresaCreatorsSession, contarConvites24h } from "@/lib/creators-gate";
import { LIMITE_CONVITES_DIA } from "@/lib/plano-creators";

export const dynamic = "force-dynamic";

// Convite para se afiliar: exclusivo do Elite. Nesta fase o convite é apenas
// REGISTRADO (sem envio de e-mail — entra com o Resend em fase futura).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireEmpresaCreatorsSession();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (gate.session.tier !== "elite") {
    return NextResponse.json({ error: "elite_only" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Limite diário SERVER-SIDE (o front desabilitar o botão é só cortesia):
  // conta os convites da empresa nas últimas 24h ANTES de inserir.
  const usados = await contarConvites24h(admin, gate.session.userId);
  if (usados >= LIMITE_CONVITES_DIA) {
    return NextResponse.json(
      { ok: false, limite: true, mensagem: `Você atingiu o limite de ${LIMITE_CONVITES_DIA} convites por dia.` },
      { status: 429 },
    );
  }

  // Confere existência do creator antes de registrar (colunas nomeadas).
  const { data: creator } = await admin
    .from("creators_legado")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!creator) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await admin.from("convites_creators").insert({
    creator_legado_id: id,
    empresa_id: gate.session.userId,
    status: "pendente",
  });

  if (error) {
    // 23505 = unique violation: esta empresa já convidou este creator.
    // Não cria registro, logo NÃO consome o limite diário.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, ja_convidado: true, restantes: LIMITE_CONVITES_DIA - usados });
    }
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ja_convidado: false, restantes: LIMITE_CONVITES_DIA - usados - 1 });
}
