"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSection, AdminBadge, Skeleton, Pagination } from "@/components/mundo-mapping/admin-ui";

type ProdutoRow = {
  produto_id: string;
  produto_nome: string;
  empresa_nome: string;
  creators: number;
  cliques: number;
  linksAtivos: number;
};

const PAGE_SIZE = 20;

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mundo-mapping/admin/produtos");
    const data = await res.json();
    setProdutos(res.ok ? (data as ProdutoRow[]) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return produtos;
    return produtos.filter(
      (p) => p.produto_nome.toLowerCase().includes(q) || p.empresa_nome.toLowerCase().includes(q)
    );
  }, [produtos, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">Admin / Produtos</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Gestão de produtos</h1>
          <p className="mt-1 text-sm text-[#888]">Produtos com links de afiliado ativos na plataforma.</p>
        </div>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white disabled:opacity-40"
          disabled={loading}
          onClick={load}
          type="button"
        >
          ↻ Atualizar
        </button>
      </div>

      <input
        className="w-64 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[#aaa] placeholder:text-[#555] outline-none focus:border-[#C8102E]"
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Buscar por nome ou empresa…"
        type="text"
        value={search}
      />

      <AdminSection
        subtitle={`${filtered.length} produto${filtered.length !== 1 ? "s" : ""} com links gerados`}
        title="Produtos"
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton className="h-12" key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#555]">
            {search ? "Nenhum produto encontrado." : "Nenhum produto com links de afiliado ainda."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Empresa</th>
                    <th className="pb-3 text-right">Creators</th>
                    <th className="pb-3 text-right">Cliques</th>
                    <th className="pb-3">Links ativos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {paginated.map((p) => (
                    <tr key={p.produto_id}>
                      <td className="py-3 font-medium text-[#aaa]">{p.produto_nome}</td>
                      <td className="py-3 text-[#888]">{p.empresa_nome}</td>
                      <td className="py-3 text-right text-[#888]">{p.creators}</td>
                      <td className="py-3 text-right font-semibold text-[#aaa]">{p.cliques.toLocaleString("pt-BR")}</td>
                      <td className="py-3">
                        <AdminBadge
                          label={String(p.linksAtivos)}
                          tone={p.linksAtivos > 0 ? "success" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination onChange={(p) => setPage(p)} page={page} pageSize={PAGE_SIZE} total={filtered.length} />
          </>
        )}
      </AdminSection>
    </div>
  );
}
