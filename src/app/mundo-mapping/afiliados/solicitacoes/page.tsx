"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type Pedido = {
  id: string;
  creator_id: string;
  creator_nome: string;
  produto_id: string;
  produto_nome: string;
  produto_slug: string;
  empresa_id: string;
  empresa_nome: string;
  status: "pendente" | "aprovado" | "rejeitado";
  motivo_rejeicao: string | null;
  comissao_tipo: string;
  comissao_valor: number;
  preco_produto: number;
  url_produto: string;
  criado_em: string;
  linkCodigo?: string;
};

type Tab = "pendente" | "aprovado" | "rejeitado";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gerarCodigo(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  pedido,
  onConfirm,
  onClose,
}: {
  pedido: Pedido;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-[24px] border border-zinc-200 bg-white p-7 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.38)]">
        <h3 className="text-base font-semibold text-zinc-950">Rejeitar solicitação</h3>
        <p className="mt-1 text-sm text-zinc-500">{pedido.creator_nome} — {pedido.produto_nome}</p>
        <textarea
          className="mt-4 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo da rejeição (opcional)"
          rows={3}
          value={motivo}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-9 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
            onClick={() => onConfirm(motivo)}
            type="button"
          >
            Confirmar rejeição
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SolicitacoesPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ userId: string; total: number } | null>(null);
  const [tab, setTab] = useState<Tab>("pendente");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Pedido | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/mundo-mapping/empresa/login");
      return;
    }

    const { data, error } = await supabase
      .from("pedidos_afiliacao")
      .select("*")
      .eq("empresa_id", user.id)
      .order("criado_em", { ascending: false });

    setDebugInfo({ userId: user.id, total: data?.length ?? 0 });

    if (error) {
      setDbError(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Pedido[];

    // For approved rows, fetch the generated link codes
    const approvedProductIds = rows
      .filter((p) => p.status === "aprovado")
      .map((p) => p.produto_id);

    let linkMap: Record<string, string> = {};
    if (approvedProductIds.length > 0) {
      const { data: links } = await supabase
        .from("links_afiliados")
        .select("produto_id, creator_id, codigo")
        .eq("empresa_id", user.id)
        .in("produto_id", approvedProductIds);

      (links ?? []).forEach((l) => {
        const key = `${l.produto_id}:${l.creator_id}`;
        linkMap[key] = l.codigo;
      });
    }

    const enriched = rows.map((p) => ({
      ...p,
      linkCodigo: linkMap[`${p.produto_id}:${p.creator_id}`],
    }));

    setPedidos(enriched);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function aprovar(pedido: Pedido) {
    setActionLoading(pedido.id);
    const supabase = createClient();

    for (let attempt = 0; attempt < 5; attempt++) {
      const codigo = gerarCodigo(8);
      const { error: linkError } = await supabase.from("links_afiliados").insert({
        codigo,
        creator_id: pedido.creator_id,
        creator_nome: pedido.creator_nome,
        produto_id: pedido.produto_id,
        produto_nome: pedido.produto_nome,
        produto_slug: pedido.produto_slug,
        empresa_id: pedido.empresa_id,
        empresa_nome: pedido.empresa_nome,
        url_produto: pedido.url_produto,
        comissao_tipo: pedido.comissao_tipo,
        comissao_valor: pedido.comissao_valor,
        preco_produto: pedido.preco_produto,
      });

      if (!linkError) {
        await supabase
          .from("pedidos_afiliacao")
          .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
          .eq("id", pedido.id);

        setPedidos((prev) =>
          prev.map((p) =>
            p.id === pedido.id ? { ...p, status: "aprovado", linkCodigo: codigo } : p
          )
        );
        setActionLoading(null);
        return;
      }
      if (linkError.code !== "23505") {
        alert("Erro ao criar link: " + linkError.message);
        setActionLoading(null);
        return;
      }
    }

    alert("Não foi possível gerar o código. Tente novamente.");
    setActionLoading(null);
  }

  async function rejeitar(pedido: Pedido, motivo: string) {
    setRejectTarget(null);
    setActionLoading(pedido.id);
    const supabase = createClient();

    await supabase
      .from("pedidos_afiliacao")
      .update({
        status: "rejeitado",
        motivo_rejeicao: motivo || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", pedido.id);

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedido.id ? { ...p, status: "rejeitado", motivo_rejeicao: motivo || null } : p
      )
    );
    setActionLoading(null);
  }

  const filtered = pedidos.filter((p) => p.status === tab);

  const counts = {
    pendente: pedidos.filter((p) => p.status === "pendente").length,
    aprovado: pedidos.filter((p) => p.status === "aprovado").length,
    rejeitado: pedidos.filter((p) => p.status === "rejeitado").length,
  };

  const TAB_LABELS: Record<Tab, string> = {
    pendente: `Pendentes${counts.pendente > 0 ? ` (${counts.pendente})` : ""}`,
    aprovado: `Aprovados${counts.aprovado > 0 ? ` (${counts.aprovado})` : ""}`,
    rejeitado: `Rejeitados${counts.rejeitado > 0 ? ` (${counts.rejeitado})` : ""}`,
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <PageHeader
        description="Gerencie quem pode se tornar afiliado dos seus produtos com aprovação manual."
        eyebrow="Mundo Mapping / Afiliados / Solicitações"
        title="Solicitações de afiliação"
      />

      <div className="p-6">
        <SectionCard
          subtitle="Aprove ou rejeite cada solicitação. Ao aprovar, o link de afiliado é gerado automaticamente para o creator."
          title="Solicitações recebidas"
        >
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
            {(["pendente", "aprovado", "rejeitado"] as Tab[]).map((t) => (
              <button
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
                key={t}
                onClick={() => setTab(t)}
                type="button"
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Debug info — remover após confirmar funcionamento */}
          {debugInfo && (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 font-mono">
              <span className="font-semibold text-zinc-700">Debug:</span>{" "}
              empresa_id = <span className="text-zinc-900">{debugInfo.userId}</span>{" · "}
              pedidos encontrados = <span className={debugInfo.total > 0 ? "text-emerald-700 font-semibold" : "text-zinc-900"}>{debugInfo.total}</span>
              {debugInfo.total === 0 && (
                <span className="ml-2 text-amber-600">
                  — verifique se os pedidos foram criados com esse empresa_id e se a migration foi executada no Supabase.
                </span>
              )}
            </div>
          )}

          {/* DB error */}
          {dbError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">Erro ao carregar solicitações</p>
              <p className="mt-1 font-mono text-xs">{dbError}</p>
              <p className="mt-2">Se a tabela ainda não existe, rode a migration <code>20260513_pedidos_afiliacao.sql</code> no Supabase SQL Editor.</p>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          ) : !dbError && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
              {tab === "pendente"
                ? "Nenhuma solicitação pendente. Quando creators solicitarem afiliação em produtos com aprovação manual, aparecerão aqui."
                : tab === "aprovado"
                ? "Nenhuma solicitação aprovada ainda."
                : "Nenhuma solicitação rejeitada."}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((pedido) => {
                const isActing = actionLoading === pedido.id;
                const linkUrl = pedido.linkCodigo ? `${origin}/r/${pedido.linkCodigo}` : null;

                return (
                  <div
                    className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                    key={pedido.id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-950">
                          {pedido.creator_nome || "Creator"}
                        </span>
                        <StatusBadge
                          label={
                            pedido.status === "pendente" ? "Pendente"
                            : pedido.status === "aprovado" ? "Aprovado"
                            : "Rejeitado"
                          }
                          tone={
                            pedido.status === "pendente" ? "warning"
                            : pedido.status === "aprovado" ? "success"
                            : "danger"
                          }
                        />
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{pedido.produto_nome}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Solicitado em {formatDate(pedido.criado_em)} ·{" "}
                        {pedido.comissao_tipo === "percent"
                          ? `${pedido.comissao_valor}% de comissão`
                          : `R$ ${Number(pedido.comissao_valor).toFixed(2)} de comissão`}
                      </p>

                      {/* Link gerado (aprovados) */}
                      {pedido.status === "aprovado" && linkUrl && (
                        <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <span className="flex-1 truncate font-mono text-xs text-emerald-800">{linkUrl}</span>
                          <button
                            className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline"
                            onClick={() => navigator.clipboard.writeText(linkUrl)}
                            type="button"
                          >
                            Copiar
                          </button>
                        </div>
                      )}

                      {/* Motivo da rejeição */}
                      {pedido.motivo_rejeicao && (
                        <p className="mt-1 text-xs text-red-600">Motivo: {pedido.motivo_rejeicao}</p>
                      )}
                    </div>

                    {pedido.status === "pendente" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                          disabled={isActing}
                          onClick={() => setRejectTarget(pedido)}
                          type="button"
                        >
                          Rejeitar
                        </button>
                        <button
                          className="inline-flex h-9 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          disabled={isActing}
                          onClick={() => aprovar(pedido)}
                          type="button"
                        >
                          {isActing ? "Aprovando…" : "Aprovar"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onConfirm={(motivo) => rejeitar(rejectTarget, motivo)}
          pedido={rejectTarget}
        />
      )}
    </>
  );
}
