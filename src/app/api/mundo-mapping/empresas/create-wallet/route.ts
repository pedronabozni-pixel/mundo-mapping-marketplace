import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasWallet } from "@/lib/asaas-wallet";

export async function POST(req: NextRequest) {
  const { access_token } = await req.json().catch(() => ({}));

  if (!access_token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(access_token);

  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const authedAdmin = createAdminClient(access_token);
  const { data: profile } = await authedAdmin
    .from("profiles")
    .select("wallet_id, company_name, full_name, email, cpf_cnpj, user_type")
    .eq("id", userId)
    .single();

  if (!profile || profile.user_type !== "empresa") {
    return NextResponse.json({ error: "not_empresa" }, { status: 403 });
  }

  if (profile.wallet_id) {
    return NextResponse.json({ wallet_id: profile.wallet_id, already_exists: true });
  }

  try {
    const wallet = await createAsaasWallet({
      name: profile.company_name ?? profile.full_name ?? user.email ?? "Empresa",
      email: profile.email ?? user.email ?? "",
      cpfCnpj: profile.cpf_cnpj,
    });

    await authedAdmin
      .from("profiles")
      .update({ wallet_id: wallet.id })
      .eq("id", userId);

    return NextResponse.json({ success: true, wallet_id: wallet.id });
  } catch (err) {
    // Qualquer erro Asaas (API key inválida, CPF duplicado, timeout, etc.)
    // é logado no servidor mas nunca propagado ao cliente — o cadastro não
    // pode falhar por causa da wallet.
    console.error("[create-wallet/empresa]", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "wallet_creation_failed" });
  }
}
