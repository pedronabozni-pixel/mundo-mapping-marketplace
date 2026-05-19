"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

async function logAction(
  supabase: ReturnType<typeof createClient>,
  action: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("admin_actions").insert({
    admin_id: user.id, admin_email: user.email,
    action, target_type: "influenciador", target_id: targetId, details,
  });
}

const APROVACAO_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  aprovado: "success",
  pendente: "warning",
  reprovado: "danger",
};

export default function AdminInfluenciadoresPage() {
  const [influenciadores, setInfluenciadores] = useState<Influenciador[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterAprovacao, setFilterAprovacao] = useState("todos");
  const [filterNiche, setFilterNiche] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [confirm, setConfirm] = useState<{ inf: Influenciador; action: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, instagram_handle, instagram_followers, niche, status, status_aprovacao, created_at")
      .eq("user_type", "influenciador")
      .order("created_at", { ascending: false });
    setInfluenciadores((data ?? []) as Influenciador[]);
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
    const supabase = createClient();
    const updates: Record<string, string> = {};

    if (action === "aprovar") updates.status_aprovacao = "aprovado";
    else if (action === "reprovar") updates.status_aprovacao = "reprovado";
    else if (action === "ativar") updates.status = "ativo";
    else if (action === "desativar") updates.status = "inativo";

    const { error } = await supabase.from("profiles").update(updates).eq("id", inf.id);
    if (!error) {
      setInfluenciadores((prev) =>
        prev.map((i) => i.id === inf.id ? { ...i, ...updates } : i)
      );
      await logAction(supabase, action, inf.id, { email: inf.email });
    }
    setConfirm(null);
  }

  return (
    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Admin / Influenciadores</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Gestão de influenciadores</h1>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700"
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome ou e-mail…"
          type="text"
          value={search}
        />
        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 outline-none"
          onChange={(e) => { setFilterAprovacao(e.target.value); setPage(1); }}
          value={filterAprovacao}
        >
          <option value="todos">Toda aprovação</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
        </select>
        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 outline-none"
          onChange={(e) => { setFilterNiche(e.target.value); setPage(1); }}
          value={filterNiche}
        >
          {niches.map((n) => (
            <option key={n} value={n}>{n === "todos" ? "Todos os nichos" : n}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 outline-none"
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
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton className="h-12" key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">Nenhum influenciador encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Instagram</th>
                    <th className="pb-3">Nicho</th>
                    <th className="pb-3">Aprovação</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginated.map((inf) => {
                    const ativo = (inf.status ?? "ativo") === "ativo";
                    const aprovacao = inf.status_aprovacao ?? "pendente";
                    return (
                      <tr key={inf.id}>
                        <td className="py-3">
                          <p className="font-medium text-zinc-300">{inf.full_name ?? "—"}</p>
                          <p className="text-xs text-zinc-600">{inf.email ?? "—"}</p>
                        </td>
                        <td className="py-3 text-zinc-400">
                          {inf.instagram_handle ? `@${inf.instagram_handle}` : "—"}
                          {inf.instagram_followers && (
                            <p className="text-xs text-zinc-600">{inf.instagram_followers.toLocaleString("pt-BR")} seguidores</p>
                          )}
                        </td>
                        <td className="py-3 text-zinc-400">{inf.niche ?? "—"}</td>
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
                              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                              href={`/mundo-mapping/admin/influenciadores/${inf.id}`}
                            >
                              Ver
                            </Link>
                            {aprovacao === "pendente" && (
                              <button
                                className="rounded-lg border border-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-950/30"
                                onClick={() => setConfirm({ inf, action: "aprovar" })}
                                type="button"
                              >
                                Aprovar
                              </button>
                            )}
                            {aprovacao !== "reprovado" && (
                              <button
                                className="rounded-lg border border-red-900/60 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-950/30"
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
