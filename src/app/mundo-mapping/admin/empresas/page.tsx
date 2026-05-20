"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminSection, AdminBadge, PlanBadge, Skeleton, Pagination, ConfirmDialog, PlanModal,
} from "@/components/mundo-mapping/admin-ui";

type Empresa = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  plano: string | null;
  status: string | null;
  created_at: string | null;
};

const PAGE_SIZE = 20;

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPlano, setFilterPlano] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [planModal, setPlanModal] = useState<Empresa | null>(null);
  const [confirm, setConfirm] = useState<{ empresa: Empresa; action: "ativar" | "desativar" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const res = await fetch("/api/mundo-mapping/admin/empresas");
    if (!res.ok) { setLoadError(true); setLoading(false); return; }
    const data = await res.json();
    setEmpresas(data as Empresa[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      const name = (e.company_name ?? e.full_name ?? "").toLowerCase();
      const email = (e.email ?? "").toLowerCase();
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;
      if (filterPlano !== "todos" && e.plano !== filterPlano) return false;
      if (filterStatus !== "todos" && (e.status ?? "ativo") !== filterStatus) return false;
      return true;
    });
  }, [empresas, search, filterPlano, filterStatus]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleStatus(empresa: Empresa, action: "ativar" | "desativar") {
    const newStatus = action === "ativar" ? "ativo" : "inativo";
    const res = await fetch(`/api/mundo-mapping/admin/profiles/${empresa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { status: newStatus }, action: `status_${newStatus}`, targetEmail: empresa.email }),
    });
    if (res.ok) {
      setEmpresas((prev) => prev.map((e) => e.id === empresa.id ? { ...e, status: newStatus } : e));
    }
    setConfirm(null);
  }

  async function handlePlanSave(empresa: Empresa, plan: string) {
    const res = await fetch(`/api/mundo-mapping/admin/profiles/${empresa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: { plano: plan }, action: "plano_alterado", targetEmail: empresa.email }),
    });
    if (res.ok) {
      setEmpresas((prev) => prev.map((e) => e.id === empresa.id ? { ...e, plano: plan } : e));
    }
    setPlanModal(null);
  }

  return (
    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Admin / Empresas e Produtores</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Gestão de empresas e produtores</h1>
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
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 outline-none focus:border-zinc-700"
          onChange={(e) => { setFilterPlano(e.target.value); setPage(1); }}
          value={filterPlano}
        >
          <option value="todos">Todos os planos</option>
          <option value="associate">Associate</option>
          <option value="partner">Partner</option>
          <option value="elite">Elite</option>
        </select>
        <select
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 outline-none focus:border-zinc-700"
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          value={filterStatus}
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      <AdminSection
        subtitle={`${filtered.length} conta${filtered.length !== 1 ? "s" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
        title="Empresas e Produtores"
      >
        {loadError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-zinc-500">Erro ao carregar dados.</p>
            <button
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
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
          <p className="py-8 text-center text-sm text-zinc-600">Nenhuma conta encontrada.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="pb-3">Empresa / Produtor</th>
                    <th className="pb-3">Plano</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Cadastro</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginated.map((empresa) => {
                    const ativo = (empresa.status ?? "ativo") === "ativo";
                    return (
                      <tr key={empresa.id}>
                        <td className="py-3">
                          <p className="font-medium text-zinc-300">{empresa.company_name ?? empresa.full_name ?? "—"}</p>
                          <p className="text-xs text-zinc-600">{empresa.email ?? "—"}</p>
                        </td>
                        <td className="py-3"><PlanBadge plano={empresa.plano} /></td>
                        <td className="py-3">
                          <AdminBadge
                            label={ativo ? "Ativo" : "Inativo"}
                            tone={ativo ? "success" : "danger"}
                          />
                        </td>
                        <td className="py-3 text-xs text-zinc-500">
                          {empresa.created_at ? new Date(empresa.created_at).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                              href={`/mundo-mapping/admin/empresas/${empresa.id}`}
                            >
                              Ver
                            </Link>
                            <button
                              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                              onClick={() => setPlanModal(empresa)}
                              type="button"
                            >
                              Plano
                            </button>
                            <button
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                                ativo
                                  ? "border-red-900/60 text-red-400 hover:bg-red-950/30"
                                  : "border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/30"
                              }`}
                              onClick={() => setConfirm({ empresa, action: ativo ? "desativar" : "ativar" })}
                              type="button"
                            >
                              {ativo ? "Desativar" : "Ativar"}
                            </button>
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

      {planModal && (
        <PlanModal
          currentPlan={planModal.plano}
          onCancel={() => setPlanModal(null)}
          onSave={(plan) => handlePlanSave(planModal, plan)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          danger={confirm.action === "desativar"}
          message={`Tem certeza que deseja ${confirm.action} a conta de "${confirm.empresa.company_name ?? confirm.empresa.email}"?`}
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleToggleStatus(confirm.empresa, confirm.action)}
          title={confirm.action === "desativar" ? "Desativar empresa" : "Ativar empresa"}
        />
      )}
    </div>
  );
}
