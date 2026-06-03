import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAsaasWallet } from "@/lib/asaas-wallet";

export default async function EmpresaDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mundo-mapping/empresa/login");
  }

  if (!user.user_metadata?.user_type) {
    await supabase.auth.updateUser({ data: { user_type: "empresa" } });
  }

  await supabase.from("profiles").upsert(
    { id: user.id, user_type: "empresa", plano: "associate" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_id, full_name, email, cpf_cnpj")
    .eq("id", user.id)
    .single();

  if (!profile?.wallet_id) {
    try {
      const wallet = await createAsaasWallet({
        name: profile?.full_name ?? user.email ?? "Empresa",
        email: profile?.email ?? user.email ?? "",
        cpfCnpj: profile?.cpf_cnpj,
      });
      await supabase
        .from("profiles")
        .update({ wallet_id: wallet.id })
        .eq("id", user.id);
    } catch (err) {
      // Qualquer erro Asaas — não bloqueia o acesso; banner âmbar no dashboard cobre o caso
      console.error("[empresa/dashboard] wallet creation failed:", err instanceof Error ? err.message : err);
    }
  }

  redirect("/mundo-mapping/afiliados");
}
