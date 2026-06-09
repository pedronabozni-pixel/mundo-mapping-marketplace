"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSection, AdminBadge, Skeleton, Pagination, ConfirmDialog } from "@/components/mundo-mapping/admin-ui";

type Influenciador = {
  id: string;
  full_name: string | null;
  email: string | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  niche: string | null;
  status: string | null;
  status_aprovacao: string | null;
  created_at: string | null;
};

const PAGE_SIZE = 20;

const APROVACAO_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  aprovado: "success",
  pendente: "warning",
  reprovado: "danger",
};

export default function AdminInfluenciadoresPage() {
  const [influenciadores, setInfluenciadores] = useState<Influenciador[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterAprovacao, setFilterAprovacao] = useState("todos");
  const [filterNiche, setFilterNiche] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [confirm, setConfirm] = useState<{ inf: Influenciador; action: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const res = await fetch("/api/mundo-mapping/admin/influenciadores");
    if (!res.ok) { setLoadError(true); setLoading(false); return; }
    const data = await res.json();
    setInfluenciadores(data as Influenciador[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const niches = useMemo(() => {
    const set = new Set(influenciadores.map((i) => i.niche).filter(Boolean) as string[]);
    return ["todos", ...Array.from(set).sort()];
  }, [influenciadores]);

  const filtered = useMemo(() => {
    return influenciadores.filter((i) => {
      const name = (i.full_name ?? "").toLowerCase();
      const email = (i.email ?? "").toLowerCase();
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;
      if (filterAprovacao !== "todos" && (i.status_aprovacao ?? "pendente") !== filterAprovacao) return false;
      if (filterNiche !== "todos" && i.niche !== filterNiche) return false;
      if (filterStatus !== "todos" && (i.status ?? "ativo") !== filterStatus) return false;
      return true;
    });
  }, [influenciadores, search, filterAprovacao, filterNiche, filterStatus]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleAction(inf: Influenciador, action: string) {
    const updates: Record<string, string> = {};
    if (action === "aprovar") updates.status_aprovacao = "aprovado";
    else if (action === "reprovar") updates.status_aprovacao = "reprovado";
    else if (action === "ativar") updates.status = "ativo";
    else if (action === "desativar") updates.status = "inativo";

    const res = await fetch(`/api/mundo-mapping/admin/profiles/${inf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, action, targetEmail: inf.email }),
    });
    if (res.ok) {
      setInfluenciadores((prev) =>
        prev.map((i) => i.id === inf.id ? { ...i, ...updates } : i)
      );
    }
    setConfirm(null);
  }

  return (
    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">Admin / Influenciadores</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Gestão de influenciadores</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="w-64 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[#aaa] placeholder:text-[#555] outline-none focus:border-[#C8102E]"
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome ou e-mail…"
          type="text"
          value={search}
        />
        <select
          className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[#888] outline-none"
          onChange={(e) => { setFilterAprovacao(e.target.value); setPage(1); }}
          value={filterAprovacao}
        >
          <option value="todos">Toda aprovação</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
        </select>
        <select
          className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[#888] outline-none"
          onChange={(e) => { setFilterNiche(e.target.value); setPage(1); }}
          value={filterNiche}
        >
          {niches.map((n) => (
            <option key={n} value={n}>{n === "todos" ? "Todos os nichos" : n}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[#888] outline-none"
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          value={filterStatus}
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      <AdminSection
        subtitle={`${filtered.length} influenciador${filtered.length !== 1 ? "es" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
        title="Influenciadores"
      >
        {loadError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-[#888]">Erro ao carregar dados.</p>
            <button
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[#aaa] transition hover:bg-[rgba(255,255,255,0.08)]"
              onClick={load}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton className="h-12" key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#555]">Nenhum influenciador encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Instagram</th>
                    <th className="pb-3">Nicho</th>
                    <th className="pb-3">Aprovação</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {paginated.map((inf) => {
                    const ativo = (inf.status ?? "ativo") === "ativo";
                    const aprovacao = inf.status_aprovacao ?? "pendente";
                    return (
                      <tr key={inf.id}>
                        <td className="py-3">
                          <p className="font-medium text-[#aaa]">{inf.full_name ?? "—"}</p>
                          <p className="text-xs text-[#555]">{inf.email ?? "—"}</p>
                        </td>
                        <td className="py-3 text-[#888]">
                          {inf.instagram_handle ? `@${inf.instagram_handle}` : "—"}
                          {inf.instagram_followers && (
                            <p className="text-xs text-[#555]">{inf.instagram_followers.toLocaleString("pt-BR")} seguidores</p>
                          )}
                        </td>
                        <td className="py-3 text-[#888]">{inf.niche ?? "—"}</td>
                        <td className="py-3">
                          <AdminBadge
                            label={aprovacao.charAt(0).toUpperCase() + aprovacao.slice(1)}
                            tone={APROVACAO_TONE[aprovacao] ?? "neutral"}
                          />
                        </td>
                        <td className="py-3">
                          <AdminBadge label={ativo ? "Ativo" : "Inativo"} tone={ativo ? "success" : "danger"} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              className="rounded-lg border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-xs font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white"
                              href={`/mundo-mapping/admin/influenciadores/${inf.id}`}
                            >
                              Ver
                            </Link>
                            {aprovacao === "pendente" && (
                              <button
                                className="rounded-lg border border-[rgba(74,222,128,0.2)] px-2.5 py-1 text-xs font-semibold text-[#4ADE80] transition hover:bg-[rgba(74,222,128,0.18)]"
                                onClick={() => setConfirm({ inf, action: "aprovar" })}
                                type="button"
                              >
                                Aprovar
                              </button>
                            )}
                            {aprovacao !== "reprovado" && (
                              <button
                                className="rounded-lg border border-[rgba(200,16,46,0.15)] px-2.5 py-1 text-xs font-semibold text-[#C8102E] transition hover:bg-[rgba(200,16,46,0.18)]"
                                onClick={() => setConfirm({ inf, action: aprovacao === "pendente" ? "reprovar" : (ativo ? "desativar" : "ativar") })}
                                type="button"
                              >
                                {aprovacao === "pendente" ? "Reprovar" : (ativo ? "Desativar" : "Ativar")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination onChange={(p) => setPage(p)} page={page} pageSize={PAGE_SIZE} total={filtered.length} />
          </>
        )}
      </AdminSection>

      {confirm && (
        <ConfirmDialog
          danger={["desativar", "reprovar"].includes(confirm.action)}
          message={`Tem certeza que deseja ${confirm.action} "${confirm.inf.full_name ?? confirm.inf.email}"?`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleAction(confirm.inf, confirm.action)}
          title={`${confirm.action.charAt(0).toUpperCase() + confirm.action.slice(1)} influenciador`}
        />
      )}
    </div>
  );
}
