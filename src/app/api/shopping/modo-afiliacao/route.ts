import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { podeExigirAprovacao } from "@/lib/plano-creators";

export const dynamic = "force-dynamic";

// Modo de afiliação EFETIVO por produto, computado server-side:
// 'manual' só vale se a empresa dona tem plano pago — empresa grátis tem
// produto sempre aberto ('automatic'), mesmo que a coluna diga 'manual'
// (produtos legados/inconsistentes; o trigger do banco cobre novos writes).
//
// Existe como rota porque o RLS de profiles ("is_admin() OR id = auth.uid()")
// impede o creator de ler o plano da empresa dona no client. A resposta expõe
// apenas o modo efetivo — nunca o plano de ninguém.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (ids.length === 0) {
    return NextResponse.json({ modos: {} });
  }

  const admin = createAdminClient();

  const { data: produtos, error } = await admin
    .from("produtos")
    .select("id, empresa_id, aprovacao_modo")
    .in("id", ids);
  if (error || !produtos) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const empresaIds = [...new Set(produtos.map((p) => p.empresa_id).filter(Boolean))];
  const { data: donos } = await admin
    .from("profiles")
    .select("id, plano")
    .in("id", empresaIds);
  const planoPorEmpresa = new Map((donos ?? []).map((d) => [d.id, d.plano as string | null]));

  const modos: Record<string, "automatic" | "manual"> = {};
  for (const p of produtos) {
    const donoPodeManual = podeExigirAprovacao(planoPorEmpresa.get(p.empresa_id));
    modos[p.id] = p.aprovacao_modo === "manual" && donoPodeManual ? "manual" : "automatic";
  }

  return NextResponse.json({ modos });
}
