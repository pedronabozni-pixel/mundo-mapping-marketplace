import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FALLBACK = "/mundo-mapping/partners";

export default async function AffiliateRedirectPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  console.log("[/r] codigo:", codigo);

  const supabase = await createClient();

  // Call RPC (SECURITY DEFINER — increments cliques and returns url_produto)
  const { data: rpcUrl, error: rpcError } = await supabase.rpc("registrar_clique", {
    p_codigo: codigo,
  });

  console.log("[/r] rpc result:", { rpcUrl, rpcError });

  if (!rpcError && rpcUrl) {
    console.log("[/r] redirecting to:", rpcUrl);
    redirect(rpcUrl as string);
  }

  // RPC failed (likely missing EXECUTE grant) — fall back to direct SELECT so we
  // at least redirect correctly while the migration hasn't run yet.
  const { data: link, error: selectError } = await supabase
    .from("links_afiliados")
    .select("url_produto")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .maybeSingle();

  console.log("[/r] direct select fallback:", { link, selectError });

  if (!selectError && link?.url_produto) {
    console.log("[/r] redirecting via direct select to:", link.url_produto);
    redirect(link.url_produto as string);
  }

  console.log("[/r] fallback LP");
  redirect(FALLBACK);
}
