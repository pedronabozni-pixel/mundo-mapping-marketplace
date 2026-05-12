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
  marca: string;
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
};

// ─── Affiliate link modal ─────────────────────────────────────────────────────

function gerarCodigo(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

type ModalState =
  | { phase: "loading" }
  | { phase: "ready"; codigo: string; isNew: boolean }
  | { phase: "error"; msg: string };

function LinkModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
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

      // Check if already affiliated
      const { data: existing } = await supabase
        .from("links_afiliados")
        .select("codigo")
        .eq("creator_id", user.id)
        .eq("produto_id", produto.id)
        .eq("ativo", true)
        .maybeSingle();

      if (existing?.codigo) {
        if (!cancelled) setState({ phase: "ready", codigo: existing.codigo, isNew: false });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

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
          empresa_nome: produto.empresa_nome ?? produto.marca,
          url_produto: produto.url_produto ?? "",
          comissao_tipo: produto.comissao_tipo,
          comissao_valor: produto.comissao_valor,
          preco_produto: produto.preco,
        });

        if (!error) {
          if (!cancelled) setState({ phase: "ready", codigo, isNew: true });
          return;
        }
        if (error.code !== "23505") {
          if (!cancelled) setState({ phase: "error", msg: error.message });
          return;
        }
      }

      if (!cancelled) setState({ phase: "error", msg: "Não foi possível gerar o link. Tente novamente." });
    }

    init();
    return () => { cancelled = true; };
  }, [produto]);

  const linkUrl = state.phase === "ready"
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
      <div className="w-full max-w-md rounded-[24px] border border-zinc-200 bg-white p-7 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.38)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-950">Link de afiliado</h3>
            <p className="mt-0.5 text-sm text-zinc-500">{produto.nome}</p>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 transition hover:bg-zinc-50"
            onClick={onClose}
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.msg}
            </div>
          )}
          {state.phase === "ready" && (
            <div className="space-y-4">
              {state.isNew && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  Link gerado com sucesso!
                </div>
              )}
              <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="flex-1 truncate text-sm font-medium text-zinc-700">{linkUrl}</span>
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
                  value={
                    produto.comissao_tipo === "percent"
                      ? `${produto.comissao_valor}%`
                      : `R$ ${produto.comissao_valor.toFixed(2)}`
                  }
                />
                <MiniStat label="Preço" value={`R$ ${produto.preco.toFixed(2)}`} />
              </div>
              {!produto.url_produto && (
                <p className="text-xs text-amber-600">
                  A empresa ainda não configurou a URL de destino. O link funciona, mas o redirecionamento será ativado quando ela for adicionada.
                </p>
              )}
              <p className="text-xs text-zinc-400">
                Cada clique neste link é rastreado e vinculado à sua conta. Veja o desempenho em{" "}
                <Link className="font-semibold text-red-700" href="/mundo-mapping/influenciadores/meus-links">
                  Meus links
                </Link>.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {state.phase === "ready" && (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              href="/mundo-mapping/influenciadores/meus-links"
            >
              Ver meus links
            </Link>
          )}
          <button
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página de shopping ────────────────────────────────────────────────────────

type SortOption = "relevant" | "commission_desc" | "price_asc";

const SORT_LABELS: Record<SortOption, string> = {
  relevant: "Relevância",
  commission_desc: "Maior comissão",
  price_asc: "Menor preço",
};

export default function InfluencerShoppingPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [search, setSearch] = useState("");
  const [nicho, setNicho] = useState("Todos");
  const [sort, setSort] = useState<SortOption>("relevant");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }

      const { data } = await supabase
        .from("produtos")
        .select("id, slug, nome, marca, categoria, descricao, url_produto, preco, comissao_tipo, comissao_valor, garantia_dias, seguidores_minimo, empresa_id, empresa_nome")
        .eq("status", "published")
        .eq("visivel_shopping", true)
        .order("criado_em", { ascending: false });

      setProdutos((data ?? []) as Produto[]);
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
          (p.marca ?? "").toLowerCase().includes(q) ||
          (p.empresa_nome ?? "").toLowerCase().includes(q)
      );
    }

    if (nicho !== "Todos") {
      list = list.filter((p) => p.categoria === nicho);
    }

    if (sort === "commission_desc") {
      list = list.sort((a, b) => {
        const aVal = a.comissao_tipo === "percent" ? (a.preco * a.comissao_valor) / 100 : a.comissao_valor;
        const bVal = b.comissao_tipo === "percent" ? (b.preco * b.comissao_valor) / 100 : b.comissao_valor;
        return bVal - aVal;
      });
    } else if (sort === "price_asc") {
      list = list.sort((a, b) => a.preco - b.preco);
    }

    return list;
  }, [produtos, search, nicho, sort]);

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
        subtitle="Clique em 'Me afiliar' para gerar seu link exclusivo de vendas para cada produto."
        title="Shopping de produtos"
      >
        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50 lg:max-w-xs"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto pelo nome…"
            type="text"
            value={search}
          />
          <select
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
            onChange={(e) => setNicho(e.target.value)}
            value={nicho}
          >
            {niches.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
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
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
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

              return (
                <article
                  className="flex flex-col overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_50px_-44px_rgba(24,24,27,0.24)]"
                  key={produto.id}
                >
                  <div className="flex-1 border-b border-zinc-100 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_100%)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          {produto.empresa_nome ?? produto.marca}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">{produto.nome}</h3>
                      </div>
                      {produto.categoria && (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                          {produto.categoria}
                        </span>
                      )}
                    </div>
                    {produto.descricao && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">{produto.descricao}</p>
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
                      className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                      onClick={() => setSelectedProduto(produto)}
                      type="button"
                    >
                      Me afiliar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      {selectedProduto && (
        <LinkModal onClose={() => setSelectedProduto(null)} produto={selectedProduto} />
      )}
    </div>
  );
}
