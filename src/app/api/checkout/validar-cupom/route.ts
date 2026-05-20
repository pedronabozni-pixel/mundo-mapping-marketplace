import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, produto_id, valor_pedido } = body;

    if (!codigo || !produto_id || valor_pedido === undefined) {
      return NextResponse.json({ valido: false, mensagem: "Dados incompletos." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: cupom } = await supabase
      .from("cupons")
      .select("id, codigo, tipo, valor, limit_usos, usos_realizados, validade, ativo")
      .eq("produto_id", produto_id)
      .ilike("codigo", codigo.trim())
      .maybeSingle();

    if (!cupom) {
      return NextResponse.json({ valido: false, mensagem: "Cupom inválido ou não encontrado." });
    }

    if (!cupom.ativo) {
      return NextResponse.json({ valido: false, mensagem: "Este cupom está inativo." });
    }

    if (cupom.validade && new Date(cupom.validade) < new Date()) {
      return NextResponse.json({ valido: false, mensagem: "Este cupom expirou." });
    }

    if (cupom.limit_usos !== null && cupom.usos_realizados >= cupom.limit_usos) {
      return NextResponse.json({ valido: false, mensagem: "Este cupom atingiu o limite de usos." });
    }

    const desconto_percentual = Number(cupom.valor);
    const valor_desconto = Math.round((Number(valor_pedido) * desconto_percentual / 100) * 100) / 100;
    const valor_final = Math.max(0, Number(valor_pedido) - valor_desconto);

    return NextResponse.json({
      valido: true,
      cupom_id: cupom.id,
      codigo: cupom.codigo.toUpperCase(),
      desconto_percentual,
      valor_desconto,
      valor_final,
      mensagem: `Cupom aplicado! Você economizou R$ ${valor_desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    });
  } catch (err) {
    return NextResponse.json({ valido: false, mensagem: "Erro ao validar cupom." }, { status: 500 });
  }
}
