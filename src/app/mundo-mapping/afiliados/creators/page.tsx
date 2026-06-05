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
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#888" }}>{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: "#555" }}>{sub}</p>}
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C8102E] border-t-transparent" />
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
        subtitle="Todos os creators que geraram links de afiliado para os produtos da sua conta."
        title="Creators afiliados"
      >
        {links.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-12 text-center"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "#888" }}>
              Nenhum creator afiliado ainda.
            </p>
            <p className="mt-2 text-xs" style={{ color: "#555" }}>
              Os links aparecem aqui quando um influenciador se afiliar a um produto cadastrado com sua conta.
            </p>
            {products.some((p) => !p.empresaId) && (
              <p className="mt-3 text-xs" style={{ color: "#FBBF24" }}>
                Alguns produtos foram criados antes desta funcionalidade. Edite-os e salve para vincular à sua conta.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs font-semibold uppercase tracking-[0.1em]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.03)", color: "#555" }}
                >
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Link gerado</th>
                  <th className="px-4 py-3 text-right">Cliques</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {links.map((link) => {
                  const comissaoLabel =
                    link.comissao_tipo === "percent"
                      ? `${link.comissao_valor}%`
                      : `R$ ${link.comissao_valor.toFixed(2)}`;

                  return (
                    <tr
                      className="transition"
                      key={link.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{link.creator_nome || "—"}</p>
                        <p className="text-xs" style={{ color: "#555" }}>{link.creator_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#aaa" }}>{link.produto_nome}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#555" }}>{getLinkUrl(link.codigo)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {link.cliques.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "#888" }}>{comissaoLabel}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={link.ativo ? "Ativo" : "Inativo"}
                          tone={link.ativo ? "success" : "warning"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                          onClick={() => toggleLink(link.id, link.ativo)}
                          style={
                            link.ativo
                              ? { border: "1px solid rgba(200,16,46,0.3)", color: "#C8102E" }
                              : { border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80" }
                          }
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
