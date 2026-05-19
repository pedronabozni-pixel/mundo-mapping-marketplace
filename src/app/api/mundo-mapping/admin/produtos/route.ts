import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("links_afiliados")
    .select("produto_id, produto_nome, empresa_nome, creator_id, cliques, ativo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as {
    produto_id: string;
    produto_nome: string;
    empresa_nome: string;
    creator_id: string;
    cliques: number;
    ativo: boolean;
  }[];

  const map: Record<string, { produto_id: string; produto_nome: string; empresa_nome: string; creators: number; cliques: number; linksAtivos: number }> = {};
  rows.forEach((r) => {
    if (!map[r.produto_id]) {
      map[r.produto_id] = {
        produto_id: r.produto_id,
        produto_nome: r.produto_nome,
        empresa_nome: r.empresa_nome || "—",
        creators: 0,
        cliques: 0,
        linksAtivos: 0,
      };
    }
    map[r.produto_id].cliques += r.cliques ?? 0;
    map[r.produto_id].creators = new Set(
      rows.filter((x) => x.produto_id === r.produto_id).map((x) => x.creator_id)
    ).size;
    if (r.ativo) map[r.produto_id].linksAtivos++;
  });

  return NextResponse.json(Object.values(map).sort((a, b) => b.cliques - a.cliques));
}
