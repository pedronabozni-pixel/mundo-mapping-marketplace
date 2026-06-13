import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [
    { count: totalEmpresas },
    { count: totalInfluenciadores },
    { count: legadoTotal },
    { count: legadoAtivados },
    { data: linksData },
    { data: vendasData },
    { data: recentProfiles },
    { data: recentVendas },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "empresa"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "influenciador"),
    admin.from("creators_legado").select("id", { count: "exact", head: true }),
    admin.from("creators_legado").select("id", { count: "exact", head: true }).eq("ativado", true),
    admin.from("links_afiliados").select("cliques").eq("ativo", true),
    admin.from("vendas").select("comissao"),
    admin
      .from("profiles")
      .select("id, full_name, razao_social, email, user_type, plano, created_at")
      .neq("user_type", "admin")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("vendas")
      .select("id, empresa_nome, creator_nome, produto_nome, comissao, status, criado_em")
      .order("criado_em", { ascending: false })
      .limit(10),
  ]);

  const links = linksData ?? [];
  const vendas = vendasData ?? [];

  return NextResponse.json({
    totalEmpresas: totalEmpresas ?? 0,
    totalInfluenciadores: totalInfluenciadores ?? 0,
    legadoTotal: legadoTotal ?? 0,
    legadoAtivados: legadoAtivados ?? 0,
    totalLinksAtivos: links.length,
    totalCliques: links.reduce((s, l) => s + ((l.cliques as number) ?? 0), 0),
    totalVendas: vendas.length,
    totalComissao: vendas.reduce((s, v) => s + ((v.comissao as number) ?? 0), 0),
    recentProfiles: recentProfiles ?? [],
    recentVendas: recentVendas ?? [],
  });
}
