"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

type LinkAfiliado = {
  id: string;
  codigo: string;
  produto_id: string;
  produto_nome: string;
  empresa_nome: string;
  url_produto: string;
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

export default function MeusLinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkAfiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }
    const { data, error } = await supabase
      .from("links_afiliados")
      .select("*")
      .eq("creator_id", user.id)
      .order("criado_em", { ascending: false });
    if (error) { setLoadError(true); setLoading(false); return; }
    setLinks((data ?? []) as LinkAfiliado[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function getLinkUrl(codigo: string) {
    return `${window.location.origin}/r/${codigo}`;
  }

  async function copyLink(codigo: string) {
    await navigator.clipboard.writeText(getLinkUrl(codigo));
    setCopied(codigo);
    setTimeout(() => setCopied(null), 2000);
  }

  async function cancelarAfiliacao(linkId: string) {
    if (!window.confirm("Tem certeza? Seu link será desativado e você não receberá mais comissões deste produto.")) return;
    setCancellingId(linkId);
    const supabase = createClient();
    const { error } = await supabase
      .from("links_afiliados")
      .update({ ativo: false })
      .eq("id", linkId);
    if (!error) {
      setLinks((prev) => prev.map((l) => l.id === linkId ? { ...l, ativo: false } : l));
    }
    setCancellingId(null);
  }

  const totalCliques = links.reduce((s, l) => s + l.cliques, 0);
  const linksAtivos = links.filter((l) => l.ativo).length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm text-zinc-500">Erro ao carregar dados.</p>
        <button
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          onClick={load}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total de cliques" value={totalCliques.toLocaleString("pt-BR")} sub="Todos os links" />
        <MetricCard label="Links ativos" value={String(linksAtivos)} sub={`de ${links.length} total`} />
        <MetricCard label="Vendas geradas" value="—" sub="Requer tabela vendas" />
        <MetricCard label="Comissão acumulada" value="—" sub="Requer tabela vendas" />
      </div>

      {/* Links table */}
      <SectionCard
        action={
          <Link
            className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
            href="/mundo-mapping/influenciadores/shopping"
          >
            Ver shopping
          </Link>
        }
        subtitle="Cada linha é um link exclusivo seu para um produto específico."
        title="Meus links de afiliado"
      >
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">Você ainda não tem links de afiliado.</p>
            <Link
              className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
              href="/mundo-mapping/influenciadores/shopping"
            >
              Acessar shopping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Meu link</th>
                  <th className="px-4 py-3 text-right">Cliques</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {links.map((link) => {
                  const comissaoLabel =
                    link.comissao_tipo === "percent"
                      ? `${link.comissao_valor}%`
                      : `R$ ${link.comissao_valor.toFixed(2)}`;
                  const linkUrl = getLinkUrl(link.codigo);

                  return (
                    <tr className="transition hover:bg-zinc-50" key={link.id}>
                      <td className="px-4 py-3 font-medium text-zinc-800">{link.produto_nome}</td>
                      <td className="px-4 py-3 text-zinc-500">{link.empresa_nome || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[180px] truncate text-xs text-zinc-500">{linkUrl}</span>
                          <button
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              copied === link.codigo
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                            onClick={() => copyLink(link.codigo)}
                            type="button"
                          >
                            {copied === link.codigo ? "Copiado!" : "Copiar"}
                          </button>
                        </div>
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
                      <td className="px-4 py-3">
                        {link.ativo && (
                          <button
                            className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            disabled={cancellingId === link.id}
                            onClick={() => cancelarAfiliacao(link.id)}
                            type="button"
                          >
                            {cancellingId === link.id ? "…" : "Cancelar"}
                          </button>
                        )}
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
