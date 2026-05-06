"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProductStore, type ProductRecord } from "@/components/mundo-mapping/product-store";
import { MiniStat, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

// ─── Código de afiliado ──────────────────────────────────────────────────────

function gerarCodigo(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// ─── Modal de link ────────────────────────────────────────────────────────────

type ModalState =
  | { phase: "loading" }
  | { phase: "ready"; codigo: string; isNew: boolean }
  | { phase: "error"; msg: string };

function LinkModal({
  product,
  onClose,
}: {
  product: ProductRecord;
  onClose: () => void;
}) {
  const [state, setState] = useState<ModalState>({ phase: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setState({ phase: "error", msg: "Você precisa estar logado para se afiliar." });
        return;
      }

      // Check if link already exists
      const { data: existing } = await supabase
        .from("links_afiliados")
        .select("codigo")
        .eq("creator_id", user.id)
        .eq("produto_id", product.id)
        .eq("ativo", true)
        .maybeSingle();

      if (existing?.codigo) {
        if (!cancelled) setState({ phase: "ready", codigo: existing.codigo, isNew: false });
        return;
      }

      // Fetch creator name to store in the link record
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Generate new unique code (retry on collision)
      for (let attempt = 0; attempt < 5; attempt++) {
        const codigo = gerarCodigo(8);
        const { error } = await supabase.from("links_afiliados").insert({
          codigo,
          creator_id: user.id,
          creator_nome: profile?.full_name ?? "",
          produto_id: product.id,
          produto_nome: product.name,
          produto_slug: product.slug,
          empresa_id: product.empresaId || null,
          empresa_nome: product.brand,
          url_produto: product.checkoutUrl ?? "",
          comissao_tipo: product.commissionType,
          comissao_valor: product.commissionValue,
          preco_produto: product.price,
        });

        if (!error) {
          if (!cancelled) setState({ phase: "ready", codigo, isNew: true });
          return;
        }

        // 23505 = unique_violation — retry with new code
        if (error.code !== "23505") {
          if (!cancelled) setState({ phase: "error", msg: error.message });
          return;
        }
      }

      if (!cancelled) setState({ phase: "error", msg: "Não foi possível gerar o link. Tente novamente." });
    }

    init();
    return () => { cancelled = true; };
  }, [product]);

  const linkUrl =
    state.phase === "ready"
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
            <p className="mt-0.5 text-sm text-zinc-500">{product.name}</p>
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
                <MiniStat label="Comissão" tone="red" value={
                  product.commissionType === "percent"
                    ? `${product.commissionValue}%`
                    : `R$ ${product.commissionValue.toFixed(2)}`
                } />
                <MiniStat label="Preço" value={`R$ ${product.price.toFixed(2)}`} />
              </div>

              {!product.checkoutUrl && (
                <p className="text-xs text-amber-600">
                  A empresa ainda não configurou a URL de destino. O link já funciona, mas o redirecionamento será ativado assim que ela for adicionada.
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
  const { products, ready } = useProductStore();
  const [authChecked, setAuthChecked] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [search, setSearch] = useState("");
  const [nicho, setNicho] = useState("Todos");
  const [sort, setSort] = useState<SortOption>("relevant");

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }
      setAuthChecked(true);
    }
    checkAuth();
  }, [router]);

  const niches = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(cats).sort()];
  }, [products]);

  const visible = useMemo(() => {
    let list = products.filter((p) => p.visibleInShopping && p.status === "published");

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    if (nicho !== "Todos") {
      list = list.filter((p) => p.category === nicho);
    }

    if (sort === "commission_desc") {
      list = [...list].sort((a, b) => {
        const aVal = a.commissionType === "percent" ? (a.price * a.commissionValue) / 100 : a.commissionValue;
        const bVal = b.commissionType === "percent" ? (b.price * b.commissionValue) / 100 : b.commissionValue;
        return bVal - aVal;
      });
    } else if (sort === "price_asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    }

    return list;
  }, [products, search, nicho, sort]);

  if (!authChecked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        action={<StatusBadge label={`${visible.length} produto${visible.length !== 1 ? "s" : ""} disponíve${visible.length !== 1 ? "is" : "l"}`} tone="success" />}
        subtitle="Clique em 'Me afiliar' para gerar seu link exclusivo de vendas para cada produto."
        title="Shopping de produtos"
      >
        {/* Filters */}
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
        {ready && visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
            Nenhum produto encontrado para este filtro.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map((product) => {
              const commissionLabel =
                product.commissionType === "percent"
                  ? `${product.commissionValue}% por venda`
                  : `R$ ${product.commissionValue.toFixed(2)} por venda`;

              return (
                <article
                  className="flex flex-col overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_50px_-44px_rgba(24,24,27,0.24)]"
                  key={product.id}
                >
                  <div className="flex-1 border-b border-zinc-100 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_100%)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{product.brand}</p>
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">{product.name}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                        {product.category}
                      </span>
                    </div>
                    {product.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">{product.description}</p>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Preço" value={`R$ ${product.price.toFixed(2)}`} />
                      <MiniStat label="Comissão" tone="red" value={commissionLabel} />
                      <MiniStat label="Garantia" value={`${product.guaranteeDays} dias`} />
                      <MiniStat label="Mín. seguidores" value={product.minimumFollowers.toLocaleString("pt-BR")} />
                    </div>

                    <button
                      className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                      onClick={() => setSelectedProduct(product)}
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

      {selectedProduct && (
        <LinkModal onClose={() => setSelectedProduct(null)} product={selectedProduct} />
      )}
    </div>
  );
}
