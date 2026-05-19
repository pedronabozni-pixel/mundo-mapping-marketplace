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
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Admin / Produtos</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Gestão de produtos</h1>
          <p className="mt-1 text-sm text-zinc-500">Produtos com links de afiliado ativos na plataforma.</p>
        </div>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
          disabled={loading}
          onClick={load}
          type="button"
        >
          ↻ Atualizar
        </button>
      </div>

      <input
        className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
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
          <p className="py-8 text-center text-sm text-zinc-600">
            {search ? "Nenhum produto encontrado." : "Nenhum produto com links de afiliado ainda."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Empresa</th>
                    <th className="pb-3 text-right">Creators</th>
                    <th className="pb-3 text-right">Cliques</th>
                    <th className="pb-3">Links ativos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginated.map((p) => (
                    <tr key={p.produto_id}>
                      <td className="py-3 font-medium text-zinc-300">{p.produto_nome}</td>
                      <td className="py-3 text-zinc-500">{p.empresa_nome}</td>
                      <td className="py-3 text-right text-zinc-400">{p.creators}</td>
                      <td className="py-3 text-right font-semibold text-zinc-300">{p.cliques.toLocaleString("pt-BR")}</td>
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
