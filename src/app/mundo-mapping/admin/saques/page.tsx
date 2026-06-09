"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSection, AdminBadge, Skeleton, Pagination } from "@/components/mundo-mapping/admin-ui";

type Status = "pendente" | "aprovado" | "pago" | "recusado";

type SaqueRow = {
  id: string;
  creator_id: string;
  valor: number;
  chave_pix: string;
  tipo_chave_pix: string;
  status: Status;
  criado_em: string;
  creator_nome: string;
  creator_email: string;
};

const STATUS_TONE: Record<Status, "warning" | "success" | "danger" | "neutral"> = {
  pendente: "warning",
  aprovado: "success",
  pago: "success",
  recusado: "danger",
};

const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  pago: "Pago",
  recusado: "Recusado",
};

const PAGE_SIZE = 20;

function fmtBRL(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminSaquesPage() {
  const [rows, setRows] = useState<SaqueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "todos">("todos");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const res = await fetch("/api/mundo-mapping/admin/saques");
    if (!res.ok) { setLoadError(true); setLoading(false); return; }
    const data = await res.json();
    setRows(data as SaqueRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    const res = await fetch(`/api/mundo-mapping/admin/saques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    setUpdating(null);
  }

  const filtered = filter === "todos" ? rows : rows.filter((r) => r.status === filter);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    pendente: rows.filter((r) => r.status === "pendente").length,
    aprovado: rows.filter((r) => r.status === "aprovado").length,
    pago: rows.filter((r) => r.status === "pago").length,
    recusado: rows.filter((r) => r.status === "recusado").length,
  };
  const totalPendente = rows.filter((r) => r.status === "pendente").reduce((s, r) => s + r.valor, 0);

  return (
    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">Admin / Saques</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Solicitações de saque</h1>
          <p className="mt-1 text-sm text-[#888]">Gerencie os pedidos de saque dos influenciadores.</p>
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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pendentes", value: counts.pendente, sub: `Total: ${fmtBRL(totalPendente)}`, tone: "warning" as const },
          { label: "Aprovados", value: counts.aprovado, sub: "Aguardando pagamento", tone: "success" as const },
          { label: "Pagos", value: counts.pago, sub: "Processados", tone: "success" as const },
          { label: "Recusados", value: counts.recusado, sub: "—", tone: "danger" as const },
        ].map((c) => (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5" key={c.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#888]">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{c.value}</p>
            <p className="mt-1 text-xs text-[#555]">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="inline-flex rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        {(["todos", "pendente", "aprovado", "pago", "recusado"] as const).map((f) => (
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f ? "bg-[rgba(255,255,255,0.06)] text-white" : "text-[#888] hover:text-[#aaa]"
            }`}
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            type="button"
          >
            {f === "todos" ? "Todos" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <AdminSection
        subtitle={`${filtered.length} solicitação${filtered.length !== 1 ? "ões" : ""}`}
        title="Solicitações"
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
            {[...Array(5)].map((_, i) => <Skeleton className="h-12" key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#555]">Nenhuma solicitação encontrada.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                    <th className="pb-3">Creator</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Chave PIX</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {paginated.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3">
                        <p className="font-medium text-[#aaa]">{r.creator_nome}</p>
                        <p className="text-xs text-[#555]">{r.creator_email}</p>
                      </td>
                      <td className="py-3 text-right font-semibold text-white">{fmtBRL(r.valor)}</td>
                      <td className="py-3 text-xs text-[#888] capitalize">{r.tipo_chave_pix}</td>
                      <td className="py-3 max-w-[160px] truncate text-[#888]">{r.chave_pix}</td>
                      <td className="py-3">
                        <AdminBadge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
                      </td>
                      <td className="py-3 text-xs text-[#888]">{fmtDate(r.criado_em)}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {r.status === "pendente" && (
                            <>
                              <button
                                className="rounded-lg border border-[rgba(74,222,128,0.3)] px-2.5 py-1 text-xs font-semibold text-[#4ADE80] transition hover:bg-[rgba(74,222,128,0.18)] disabled:opacity-40"
                                disabled={updating === r.id}
                                onClick={() => updateStatus(r.id, "aprovado")}
                                type="button"
                              >
                                Aprovar
                              </button>
                              <button
                                className="rounded-lg border border-[rgba(200,16,46,0.3)] px-2.5 py-1 text-xs font-semibold text-[#C8102E] transition hover:bg-[rgba(200,16,46,0.18)] disabled:opacity-40"
                                disabled={updating === r.id}
                                onClick={() => updateStatus(r.id, "recusado")}
                                type="button"
                              >
                                Recusar
                              </button>
                            </>
                          )}
                          {r.status === "aprovado" && (
                            <button
                              className="rounded-lg bg-[#4ADE80] px-2.5 py-1 text-xs font-bold text-[#0a0a0a] transition hover:opacity-90 disabled:opacity-40"
                              disabled={updating === r.id}
                              onClick={() => updateStatus(r.id, "pago")}
                              type="button"
                            >
                              Marcar como pago
                            </button>
                          )}
                          {(r.status === "pago" || r.status === "recusado") && (
                            <span className="text-xs text-[#555]">—</span>
                          )}
                        </div>
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
