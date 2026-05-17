import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembrosManagerClient from "./membros-manager-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProdutoMembrosPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mundo-mapping/login");

  const { data: produto } = await supabase
    .from("produtos")
    .select("id, slug, nome, tipo_entregavel")
    .eq("slug", slug)
    .eq("empresa_id", user.id)
    .maybeSingle();

  if (!produto) notFound();

  // Módulos com aulas
  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id, titulo, descricao, ordem,
      aulas (
        id, titulo, descricao, video_url, duracao_minutos, ordem, liberado_em
      )
    `)
    .eq("produto_id", produto.id)
    .order("ordem");

  // Acessos
  const { data: acessos } = await supabase
    .from("acessos_membros")
    .select("id, comprador_email, comprador_nome, ativo, expira_em, created_at")
    .eq("produto_id", produto.id)
    .order("created_at", { ascending: false });

  return (
    <MembrosManagerClient
      produto={produto}
      empresaId={user.id}
      modulosIniciais={modulos ?? []}
      acessosIniciais={acessos ?? []}
    />
  );
}
