import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasWallet } from "@/lib/asaas-wallet";

export async function POST(req: NextRequest) {
  const { access_token } = await req.json().catch(() => ({}));

  if (!access_token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  // Verify token and get user identity
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(access_token);

  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Read profile (use access token so RLS allows it, or admin bypasses)
  const authedAdmin = createAdminClient(access_token);
  const { data: profile } = await authedAdmin
    .from("profiles")
    .select("wallet_id, full_name, email, cpf_cnpj, phone, user_type")
    .eq("id", userId)
    .single();

  if (!profile || profile.user_type !== "influenciador") {
    return NextResponse.json({ error: "not_influencer" }, { status: 403 });
  }

  // Already has wallet — nothing to do
  if (profile.wallet_id) {
    return NextResponse.json({ wallet_id: profile.wallet_id, already_exists: true });
  }

  try {
    const wallet = await createAsaasWallet({
      name: profile.full_name ?? user.email ?? "Influenciador",
      email: profile.email ?? user.email ?? "",
      cpfCnpj: profile.cpf_cnpj,
      mobilePhone: profile.phone,
    });

    await authedAdmin
      .from("profiles")
      .update({ wallet_id: wallet.id })
      .eq("id", userId);

    return NextResponse.json({ wallet_id: wallet.id });
  } catch (err) {
    // Wallet creation failed (e.g. CPF/email já cadastrado no Asaas).
    // Não bloqueia o cadastro — influenciador pode adicionar manualmente no perfil.
    return NextResponse.json({
      wallet_id: null,
      error: err instanceof Error ? err.message : "Erro ao criar wallet",
    });
  }
}
