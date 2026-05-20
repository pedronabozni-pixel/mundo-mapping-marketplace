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

    // Verifica que o produto pertence ao usuário autenticado (empresa_id = auth.uid())
    const { data: produto } = await supabase
      .from("produtos")
      .select("id")
      .eq("id", produto_id)
      .eq("empresa_id", user.id)
      .maybeSingle();

    if (!produto) {
      return NextResponse.json({ ok: false, error: "Produto não encontrado." }, { status: 403 });
    }

    const { error } = await supabase
      .from("acessos_membros")
      .upsert(
        {
          empresa_id: user.id,
          produto_id,
          comprador_email: comprador_email.toLowerCase().trim(),
          comprador_nome: comprador_nome ?? null,
          expira_em: expira_em ?? null,
          ativo: true,
        },
        { onConflict: "produto_id,comprador_email" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: "Erro ao conceder acesso." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
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

    const { error } = await supabase
      .from("acessos_membros")
      .update({ ativo: false })
      .eq("empresa_id", user.id)
      .eq("produto_id", produto_id)
      .eq("comprador_email", comprador_email.toLowerCase().trim());

    if (error) {
      return NextResponse.json({ ok: false, error: "Erro ao revogar acesso." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
