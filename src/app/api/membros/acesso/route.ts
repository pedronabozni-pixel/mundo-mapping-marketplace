import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST — conceder acesso manual
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const { produto_id, comprador_email, comprador_nome, expira_em } = await req.json();
    if (!produto_id || !comprador_email) {
      return NextResponse.json({ ok: false, error: "produto_id e comprador_email são obrigatórios." }, { status: 400 });
    }

    // Verifica que o usuário é da empresa dona do produto
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!empresa) {
      return NextResponse.json({ ok: false, error: "Empresa não encontrada." }, { status: 403 });
    }

    const { error } = await supabase
      .from("acessos_membros")
      .upsert(
        {
          empresa_id: empresa.id,
          produto_id,
          comprador_email: comprador_email.toLowerCase().trim(),
          comprador_nome: comprador_nome ?? null,
          expira_em: expira_em ?? null,
          ativo: true,
        },
        { onConflict: "produto_id,comprador_email" }
      );

    if (error) {
      console.error("[acesso/POST]", error);
      return NextResponse.json({ ok: false, error: "Erro ao conceder acesso." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[acesso/POST]", err);
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}

// DELETE — revogar acesso
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const { produto_id, comprador_email } = await req.json();
    if (!produto_id || !comprador_email) {
      return NextResponse.json({ ok: false, error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!empresa) {
      return NextResponse.json({ ok: false, error: "Empresa não encontrada." }, { status: 403 });
    }

    const { error } = await supabase
      .from("acessos_membros")
      .update({ ativo: false })
      .eq("empresa_id", empresa.id)
      .eq("produto_id", produto_id)
      .eq("comprador_email", comprador_email.toLowerCase().trim());

    if (error) {
      console.error("[acesso/DELETE]", error);
      return NextResponse.json({ ok: false, error: "Erro ao revogar acesso." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[acesso/DELETE]", err);
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
