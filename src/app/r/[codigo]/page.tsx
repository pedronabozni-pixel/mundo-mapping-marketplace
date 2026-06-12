import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FALLBACK = "/mundo-mapping/partners";

// Quando o destino é o checkout interno da Mapping (/checkout/<slug>), anexa
// ?ref=<codigo> para preservar a atribuição da comissão — o checkout lê esse
// parâmetro. Destinos externos (Hotmart etc.) passam intocados.
function withRef(url: string, codigo: string): string {
  if (!url.includes("/checkout/")) return url;
  if (/[?&]ref=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "ref=" + encodeURIComponent(codigo);
}

export default async function AffiliateRedirectPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const supabase = await createClient();

  // Call RPC (SECURITY DEFINER — increments cliques and returns url_produto)
  const { data: rpcUrl, error: rpcError } = await supabase.rpc("registrar_clique", {
    p_codigo: codigo,
  });

  if (!rpcError && rpcUrl) {
    redirect(withRef(rpcUrl as string, codigo));
  }

  // RPC failed (likely missing EXECUTE grant) — fall back to direct SELECT so we
  // at least redirect correctly while the migration hasn't run yet.
  const { data: link, error: selectError } = await supabase
    .from("links_afiliados")
    .select("url_produto")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .maybeSingle();

  if (!selectError && link?.url_produto) {
    redirect(withRef(link.url_produto as string, codigo));
  }

  redirect(FALLBACK);
}
