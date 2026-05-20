import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const { aula_id, produto_id, concluida } = await req.json();
    if (!aula_id || !produto_id || typeof concluida !== "boolean") {
      return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    }

    const { error } = await supabase
      .from("progresso_aulas")
      .upsert(
        {
          user_id: user.id,
          aula_id,
          produto_id,
          concluida,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,aula_id" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: "Erro ao salvar progresso." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
