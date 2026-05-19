import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: saques, error } = await admin
    .from("solicitacoes_saque")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!saques || saques.length === 0) return NextResponse.json([]);

  const creatorIds = [...new Set(saques.map((s) => s.creator_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", creatorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const rows = saques.map((s) => {
    const p = profileMap.get(s.creator_id as string);
    return {
      id: s.id,
      creator_id: s.creator_id,
      valor: s.valor,
      chave_pix: s.chave_pix,
      tipo_chave_pix: s.tipo_chave_pix,
      status: s.status ?? "pendente",
      criado_em: s.criado_em,
      creator_nome: (p?.full_name as string) ?? (p?.email as string) ?? s.creator_id,
      creator_email: (p?.email as string) ?? "—",
    };
  });

  return NextResponse.json(rows);
}
