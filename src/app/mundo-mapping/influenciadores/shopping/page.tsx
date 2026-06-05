"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MiniStat, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type Produto = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  descricao: string;
  url_produto: string;
  preco: number;
  comissao_tipo: "percent" | "fixed";
  comissao_valor: number;
  garantia_dias: number;
  seguidores_minimo: number;
  empresa_id: string;
  empresa_nome: string | null;
  aprovacao_modo: "automatic" | "manual";
};

type AffStatus = "none" | "has_link" | "pending" | "approved" | "rejected";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gerarCodigo(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "loading" }
  | { phase: "link_ready"; codigo: string; isNew: boolean }
  | { phase: "request_sent" }
  | { phase: "request_pending" }
  | { phase: "request_rejected" }
  | { phase: "error"; msg: string };

function LinkModal({
  produto,
  currentStatus,
  onClose,
  onStatusChange,
}: {
  produto: Produto;
  currentStatus: AffStatus;
  onClose: () => void;
  onStatusChange: (next: AffStatus) => void;
}) {
  const [state, setState] = useState<ModalState>({ phase: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState({ phase: "error", msg: "Você precisa estar logado para se afiliar." });
        return;
      }

      // — Automatic mode —
      if (produto.aprovacao_modo === "automatic") {
        const { data: existing } = await supabase
          .from("links_afiliados")
          .select("codigo")
          .eq("creator_id", user.id)
          .eq("produto_id", produto.id)
          .eq("ativo", true)
          .maybeSingle();

        if (existing?.codigo) {
          if (!cancelled) setState({ phase: "link_ready", codigo: existing.codigo, isNew: false });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles").select("full_name").eq("id", user.id).single();

        for (let attempt = 0; attempt < 5; attempt++) {
          const codigo = gerarCodigo(8);
          const { error } = await supabase.from("links_afiliados").insert({
            codigo,
            creator_id: user.id,
            creator_nome: profile?.full_name ?? "",
            produto_id: produto.id,
            produto_nome: produto.nome,
            produto_slug: produto.slug,
            empresa_id: produto.empresa_id,
            empresa_nome: produto.empresa_nome ?? "",
            url_produto: produto.url_produto ?? "",
            comissao_tipo: produto.comissao_tipo,
            comissao_valor: produto.comissao_valor,
            preco_produto: produto.preco,
          });

          if (!error) {
            if (!cancelled) {
              setState({ phase: "link_ready", codigo, isNew: true });
              onStatusChange("has_link");
            }
            return;
          }
          if (error.code !== "23505") {
            if (!cancelled) setState({ phase: "error", msg: error.message });
            return;
          }
        }
        if (!cancelled) setState({ phase: "error", msg: "Não foi possível gerar o link. Tente novamente." });
        return;
      }

      // — Manual mode —

      // Already has active link (approved + link created)
      if (currentStatus === "has_link" || currentStatus === "approved") {
        const { data: link } = await supabase
          .from("links_afiliados")
          .select("codigo")
          .eq("creator_id", user.id)
          .eq("produto_id", produto.id)
          .eq("ativo", true)
          .maybeSingle();

        if (link?.codigo) {
          if (!cancelled) setState({ phase: "link_ready", codigo: link.codigo, isNew: false });
        } else {
          if (!cancelled) setState({ phase: "request_pending" });
        }
        return;
      }

      if (currentStatus === "pending") {
        if (!cancelled) setState({ phase: "request_pending" });
        return;
      }

      if (currentStatus === "rejected") {
        if (!cancelled) setState({ phase: "request_rejected" });
        return;
      }

      // No request yet — create one
      const { data: profile } = await supabase
        .from("profiles").select("full_name").eq("id", user.id).single();

      const { error } = await supabase.from("pedidos_afiliacao").upsert(
        {
          creator_id: user.id,
          creator_nome: profile?.full_name ?? "",
          produto_id: produto.id,
          produto_nome: produto.nome,
          produto_slug: produto.slug,
          empresa_id: produto.empresa_id,
          empresa_nome: produto.empresa_nome ?? "",
          url_produto: produto.url_produto ?? "",
          comissao_tipo: produto.comissao_tipo,
          comissao_valor: produto.comissao_valor,
          preco_produto: produto.preco,
          status: "pendente",
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "creator_id,produto_id" }
      );

      if (!cancelled) {
        if (error) {
          setState({ phase: "error", msg: error.message });
        } else {
          setState({ phase: "request_sent" });
          onStatusChange("pending");
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [produto, currentStatus, onStatusChange]);

  const linkUrl =
    state.phase === "link_ready"
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${state.codigo}`
      : "";

  async function copy() {
    await navigator.clipboard.writeText(linkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-[24px] p-7" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {produto.aprovacao_modo === "manual" ? "Afiliação com aprovação" : "Link de afiliado"}
            </h3>
            <p className="mt-0.5 text-sm" style={{ color: "#888" }}>{produto.nome}</p>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition"
            onClick={onClose}
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#555" }}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-6">
          {state.phase === "loading" && (
            <div className="flex items-center justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            </div>
          )}

          {state.phase === "error" && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
              {state.msg}
            </div>
          )}

          {state.phase === "link_ready" && (
            <div className="space-y-4">
              {state.isNew && (
                <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ADE80" }}>
                  Link gerado com sucesso!
                </div>
              )}
              <div className="flex items-center gap-2 overflow-hidden rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="flex-1 truncate text-sm font-medium text-white">{linkUrl}</span>
                <button
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    copied ? "bg-emerald-600 text-white" : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  onClick={copy}
                  type="button"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Comissão"
                  tone="red"
                  value={produto.comissao_tipo === "percent" ? `${produto.comissao_valor}%` : `R$ ${produto.comissao_valor.toFixed(2)}`}
                />
                <MiniStat label="Preço" value={`R$ ${produto.preco.toFixed(2)}`} />
              </div>
              <p className="text-xs" style={{ color: "#555" }}>
                Veja o desempenho em{" "}
                <Link className="font-semibold text-[#C8102E] hover:underline" href="/mundo-mapping/influenciadores/meus-links">
                  Meus links
                </Link>.
              </p>
            </div>
          )}

          {(state.phase === "request_sent" || state.phase === "request_pending") && (
            <div className="space-y-4">
              <div className="rounded-xl px-4 py-4 text-sm" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}>
                <p className="font-semibold">
                  {state.phase === "request_sent" ? "Solicitação enviada!" : "Solicitação pendente"}
                </p>
                <p className="mt-1 leading-6" style={{ color: "#aaa" }}>
                  Sua solicitação foi encaminhada para a empresa. Quando aprovada, seu link de afiliado será liberado automaticamente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Comissão prevista"
                  tone="red"
                  value={produto.comissao_tipo === "percent" ? `${produto.comissao_valor}%` : `R$ ${produto.comissao_valor.toFixed(2)}`}
                />
                <MiniStat label="Preço" value={`R$ ${produto.preco.toFixed(2)}`} />
              </div>
            </div>
          )}

          {state.phase === "request_rejected" && (
            <div className="rounded-xl px-4 py-4 text-sm" style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
              <p className="font-semibold">Solicitação rejeitada</p>
              <p className="mt-1 leading-6" style={{ color: "#aaa" }}>
                Sua solicitação foi rejeitada pela empresa. Entre em contato com o suporte se tiver dúvidas.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {state.phase === "link_ready" && (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
              href="/mundo-mapping/influenciadores/meus-links"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              Ver meus links
            </Link>
          )}
          <button
            className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition"
            onClick={onClose}
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shopping page ─────────────────────────────────────────────────────────────

type SortOption = "relevant" | "commission_desc" | "price_asc";

const SORT_LABELS: Record<SortOption, string> = {
  relevant: "Relevância",
  commission_desc: "Maior comissão",
  price_asc: "Menor preço",
};

function cardButtonProps(status: AffStatus): { label: string; disabled: boolean; variant: string } {
  switch (status) {
    case "has_link":
    case "approved":
      return { label: "Ver link", disabled: false, variant: "success" };
    case "pending":
      return { label: "Aguardando aprovação", disabled: true, variant: "waiting" };
    case "rejected":
      return { label: "Reprovado", disabled: false, variant: "rejected" };
    default:
      return { label: "Me afiliar", disabled: false, variant: "default" };
  }
}

export default function InfluencerShoppingPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [affiliationStatus, setAffiliationStatus] = useState<Record<string, AffStatus>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [nicho, setNicho] = useState("Todos");
  const [sort, setSort] = useState<SortOption>("relevant");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }

      const [{ data: produtosData }, { data: myLinks }, { data: myRequests }] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, slug, nome, categoria, descricao, url_produto, preco, comissao_tipo, comissao_valor, garantia_dias, seguidores_minimo, empresa_id, empresa_nome, aprovacao_modo")
          .eq("status", "published")
          .eq("visivel_shopping", true)
          .order("criado_em", { ascending: false }),
        supabase
          .from("links_afiliados")
          .select("produto_id")
          .eq("creator_id", user.id)
          .eq("ativo", true),
        supabase
          .from("pedidos_afiliacao")
          .select("produto_id, status")
          .eq("creator_id", user.id),
      ]);

      setProdutos((produtosData ?? []) as Produto[]);

      const status: Record<string, AffStatus> = {};
      (myLinks ?? []).forEach((l) => { status[l.produto_id] = "has_link"; });
      (myRequests ?? []).forEach((r) => {
        if (status[r.produto_id]) return; // link takes priority
        status[r.produto_id] =
          r.status === "pendente" ? "pending"
          : r.status === "aprovado" ? "approved"
          : "rejected";
      });
      setAffiliationStatus(status);
      setLoading(false);
    }
    load();
  }, [router]);

  const niches = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    return ["Todos", ...Array.from(cats).sort()];
  }, [produtos]);

  const visible = useMemo(() => {
    let list = [...produtos];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.empresa_nome ?? "").toLowerCase().includes(q)
      );
    }
    if (nicho !== "Todos") list = list.filter((p) => p.categoria === nicho);
    if (sort === "commission_desc") {
      list = list.sort((a, b) => {
        const av = a.comissao_tipo === "percent" ? (a.preco * a.comissao_valor) / 100 : a.comissao_valor;
        const bv = b.comissao_tipo === "percent" ? (b.preco * b.comissao_valor) / 100 : b.comissao_valor;
        return bv - av;
      });
    } else if (sort === "price_asc") {
      list = list.sort((a, b) => a.preco - b.preco);
    }
    return list;
  }, [produtos, search, nicho, sort]);

  async function cancelarSolicitacao(produtoId: string) {
    if (!window.confirm("Tem certeza que deseja cancelar esta solicitação?")) return;
    setCancellingId(produtoId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCancellingId(null); return; }
    await supabase
      .from("pedidos_afiliacao")
      .delete()
      .eq("creator_id", user.id)
      .eq("produto_id", produtoId);
    setAffiliationStatus((prev) => ({ ...prev, [produtoId]: "none" }));
    setCancellingId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        action={
          <StatusBadge
            label={`${visible.length} produto${visible.length !== 1 ? "s" : ""} disponíve${visible.length !== 1 ? "is" : "l"}`}
            tone="success"
          />
        }
        subtitle="Clique em 'Me afiliar' para solicitar ou gerar seu link exclusivo de vendas."
        title="Shopping de produtos"
      >
        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555] lg:max-w-xs"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto pelo nome…"
            type="text"
            value={search}
          />
          <select
            className="rounded-xl px-4 py-3 text-sm text-white outline-none transition"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
            onChange={(e) => setNicho(e.target.value)}
            value={nicho}
          >
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            className="rounded-xl px-4 py-3 text-sm text-white outline-none transition"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
            onChange={(e) => setSort(e.target.value as SortOption)}
            value={sort}
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="rounded-2xl px-6 py-12 text-center text-sm" style={{ border: "1px dashed rgba(255,255,255,0.06)", color: "#555" }}>
            {produtos.length === 0
              ? "Nenhum produto disponível no momento. Volte em breve!"
              : "Nenhum produto encontrado para este filtro."}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map((produto) => {
              const commissionLabel =
                produto.comissao_tipo === "percent"
                  ? `${produto.comissao_valor}% por venda`
                  : `R$ ${produto.comissao_valor.toFixed(2)} por venda`;
              const aff = affiliationStatus[produto.id] ?? "none";
              const btn = cardButtonProps(aff);

              return (
                <article
                  className="flex flex-col overflow-hidden rounded-[22px]"
                  key={produto.id}
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="flex-1 p-5"
                    style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {produto.empresa_nome && (
                          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#555" }}>
                            {produto.empresa_nome}
                          </p>
                        )}
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{produto.nome}</h3>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {produto.categoria && (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}>
                            {produto.categoria}
                          </span>
                        )}
                        {produto.aprovacao_modo === "manual" && (
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                            Aprovação manual
                          </span>
                        )}
                      </div>
                    </div>
                    {produto.descricao && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6" style={{ color: "#888" }}>{produto.descricao}</p>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Preço" value={`R$ ${produto.preco.toFixed(2)}`} />
                      <MiniStat label="Comissão" tone="red" value={commissionLabel} />
                      <MiniStat label="Garantia" value={`${produto.garantia_dias} dias`} />
                      <MiniStat label="Mín. seguidores" value={produto.seguidores_minimo.toLocaleString("pt-BR")} />
                    </div>
                    <button
                      className="w-full rounded-xl py-3 text-sm font-bold transition"
                      disabled={btn.disabled}
                      onClick={() => !btn.disabled && setSelectedProduto(produto)}
                      style={
                        btn.variant === "success"
                          ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)" }
                          : btn.variant === "waiting"
                          ? { background: "rgba(251,191,36,0.08)", color: "#FBBF24", cursor: "not-allowed" }
                          : btn.variant === "rejected"
                          ? { background: "rgba(200,16,46,0.08)", color: "#C8102E", border: "1px solid rgba(200,16,46,0.2)" }
                          : { background: "#C8102E", color: "#fff" }
                      }
                      type="button"
                    >
                      {btn.label}
                    </button>
                    {aff === "pending" && (
                      <button
                        className="w-full rounded-xl py-2 text-xs font-semibold transition disabled:opacity-50"
                        disabled={cancellingId === produto.id}
                        onClick={() => cancelarSolicitacao(produto.id)}
                        style={{ border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}
                        type="button"
                      >
                        {cancellingId === produto.id ? "Cancelando…" : "Cancelar solicitação"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      {selectedProduto && (
        <LinkModal
          currentStatus={affiliationStatus[selectedProduto.id] ?? "none"}
          onClose={() => setSelectedProduto(null)}
          onStatusChange={(next) =>
            setAffiliationStatus((prev) => ({ ...prev, [selectedProduto.id]: next }))
          }
          produto={selectedProduto}
        />
      )}
    </div>
  );
}
