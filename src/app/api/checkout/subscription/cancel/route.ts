import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription, AsaasError } from "@/lib/asaas";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseSession.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("asaas_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.asaas_subscription_id) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada." }, { status: 400 });
  }

  try {
    await cancelSubscription(profile.asaas_subscription_id);
  } catch (e) {
    if (e instanceof AsaasError && e.httpStatus === 404) {
      // Already cancelled in Asaas — proceed to update profile
    } else {
      const msg = e instanceof AsaasError ? e.message : "Erro ao cancelar assinatura.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  await supabase.from("profiles").update({
    plano: "associate",
    asaas_subscription_id: null,
    plano_valido_ate: null,
    plano_status: "ativo",
  }).eq("id", user.id);

  // Downgrade para o plano grátis: produtos com aprovação manual ficam
  // abertos na hora (grátis não pode exigir aprovação; espelha o trigger).
  await supabase
    .from("produtos")
    .update({ aprovacao_modo: "automatic" })
    .eq("empresa_id", user.id)
    .eq("aprovacao_modo", "manual");

  return NextResponse.json({ success: true });
}
