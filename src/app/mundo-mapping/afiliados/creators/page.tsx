"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";

type LinkAfiliado = {
  id: string;
  codigo: string;
  creator_id: string;
  creator_nome: string;
  produto_id: string;
  produto_nome: string;
  comissao_tipo: string;
  comissao_valor: number;
  preco_produto: number;
  cliques: number;
  ativo: boolean;
  criado_em: string;
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function CreatorsPage() {
  const router = useRouter();
  const { products } = useProductStore();
  const [links, setLinks] = useState<LinkAfiliado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/mundo-mapping/empresa/login");
        return;
      }

      const { data } = await supabase
        .from("links_afiliados")
        .select("*")
        .eq("empresa_id", user.id)
        .order("criado_em", { ascending: false });

      setLinks((data ?? []) as LinkAfiliado[]);
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleLink(id: string, currentAtivo: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("links_afiliados")
      .update({ ativo: !currentAtivo })
      .eq("id", id);

    if (!error) {
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ativo: !currentAtivo } : l))
      );
    }
  }

  const totalCliques = links.reduce((s, l) => s + l.cliques, 0);
  const linksAtivos = links.filter((l) => l.ativo).length;
  const creatorsUnicos = new Set(links.map((l) => l.creator_id)).size;

  const getLinkUrl = (codigo: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/r/${codigo}` : `/r/${codigo}`;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Creators afiliados" value={String(creatorsUnicos)} sub="Únicos com link ativo" />
        <MetricCard label="Links ativos" value={String(linksAtivos)} sub={`de ${links.length} total`} />
        <MetricCard label="Total de cliques" value={totalCliques.toLocaleString("pt-BR")} sub="Em todos os links" />
        <MetricCard label="Vendas geradas" value="—" sub="Requer tabela vendas" />
      </div>

      <SectionCard
        subtitle="Todos os creators que geraram links de afiliado para os produtos da sua empresa."
        title="Creators afiliados"
      >
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              Nenhum creator afiliado ainda.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Os links aparecem aqui quando um influenciador se afiliar a um produto cadastrado com sua conta.
            </p>
            {products.some((p) => !p.empresaId) && (
              <p className="mt-3 text-xs text-amber-600">
                Alguns produtos foram criados antes desta funcionalidade. Edite-os e salve para vincular à sua conta.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Link gerado</th>
                  <th className="px-4 py-3 text-right">Cliques</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {links.map((link) => {
                  const comissaoLabel =
                    link.comissao_tipo === "percent"
                      ? `${link.comissao_valor}%`
                      : `R$ ${link.comissao_valor.toFixed(2)}`;

                  return (
                    <tr className="transition hover:bg-zinc-50" key={link.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{link.creator_nome || "—"}</p>
                        <p className="text-xs text-zinc-400">{link.creator_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{link.produto_nome}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-400">{getLinkUrl(link.codigo)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-800">
                        {link.cliques.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-600">{comissaoLabel}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={link.ativo ? "Ativo" : "Inativo"}
                          tone={link.ativo ? "success" : "warning"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            link.ativo
                              ? "border border-red-200 text-red-600 hover:bg-red-50"
                              : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                          onClick={() => toggleLink(link.id, link.ativo)}
                          type="button"
                        >
                          {link.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
