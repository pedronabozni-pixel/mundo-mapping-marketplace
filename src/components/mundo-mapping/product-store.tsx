"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = "draft" | "published" | "paused";
export type ApprovalMode = "automatic" | "manual";
export type CommissionType = "percent" | "fixed";
export type AttributionModel = "last_click" | "coupon_priority" | "hybrid";
export type CommissionBase = "gross" | "net" | "net_without_freight";
export type PayoutMode = "platform_split" | "platform_ledger";

export const PRODUCT_TYPE_OPTIONS = [
  "Fisico",
  "Infoproduto | Ebook",
  "Cursos",
  "Servicos",
  "Experiencias",
  "Diarias",
  "Customizado"
] as const;

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  checkoutUrl: string;
  empresaId: string;
  commissionType: CommissionType;
  commissionValue: number;
  commissionBase: CommissionBase;
  guaranteeDays: number;
  releaseDays: number;
  payoutMode: PayoutMode;
  attributionModel: AttributionModel;
  attributionWindowDays: number;
  couponEnabled: boolean;
  approvalMode: ApprovalMode;
  visibleInShopping: boolean;
  status: ProductStatus;
  description: string;
  audience: string;
  minimumCreatorScore: number;
  minimumFollowers: number;
  allowedRegions: string;
  whitelistOnly: boolean;
  requireSocialProof: boolean;
  materialsSummary: string;
  coverAssetMode: "link" | "file";
  coverAssetUrl: string;
  coverAssetName: string;
  promoAssetMode: "link" | "file";
  promoAssetUrl: string;
  promoAssetName: string;
  checkoutColor: string;
  checkoutBannerMode: "link" | "file";
  checkoutBannerUrl: string;
  checkoutBannerName: string;
  checkoutHeadline: string;
  checkoutSubheadline: string;
  checkoutCtaLabel: string;
  checkoutGuaranteeText: string;
  checkoutSupportText: string;
  checkoutHighlights: string;
  supportEmail: string;
  logisticsMode: "digital" | "physical" | "service" | "daily";
  stockRequired: boolean;
  shippingManagedBy: "company" | "customer" | "na";
  bookingRequired: boolean;
  noShowPolicy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Omit<ProductRecord, "id" | "slug" | "createdAt" | "updatedAt">;

type ProductStoreValue = {
  products: ProductRecord[];
  ready: boolean;
  createProduct: (input: ProductInput, publish?: boolean) => Promise<ProductRecord | null>;
  updateProduct: (slug: string, input: ProductInput, publish?: boolean) => Promise<ProductRecord | null>;
  setProductStatus: (slug: string, status: ProductStatus) => void;
  deleteProduct: (slug: string) => void;
  getProductBySlug: (slug: string) => ProductRecord | undefined;
};

// ─── Row ↔ Record mapping ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: Record<string, any>): ProductRecord {
  return {
    id: r.id,
    slug: r.slug,
    name: r.nome ?? "",
    brand: r.marca ?? "Mundo Mapping",
    category: r.categoria ?? "Infoproduto | Ebook",
    price: Number(r.preco) || 0,
    checkoutUrl: r.url_produto ?? "",
    empresaId: r.empresa_id ?? "",
    commissionType: (r.comissao_tipo as CommissionType) ?? "percent",
    commissionValue: Number(r.comissao_valor) || 20,
    commissionBase: (r.comissao_base as CommissionBase) ?? "gross",
    guaranteeDays: Number(r.garantia_dias) || 14,
    releaseDays: Number(r.liberacao_dias) || 14,
    payoutMode: (r.payout_mode as PayoutMode) ?? "platform_ledger",
    attributionModel: (r.attribution_model as AttributionModel) ?? "last_click",
    attributionWindowDays: Number(r.attribution_window_dias) || 7,
    couponEnabled: Boolean(r.cupom_habilitado),
    approvalMode: (r.aprovacao_modo as ApprovalMode) ?? "manual",
    visibleInShopping: Boolean(r.visivel_shopping),
    status: (r.status as ProductStatus) ?? "draft",
    description: r.descricao ?? "",
    audience: r.publico ?? "",
    minimumCreatorScore: Number(r.score_minimo) || 70,
    minimumFollowers: Number(r.seguidores_minimo) || 5000,
    allowedRegions: r.regioes_permitidas ?? "Brasil",
    whitelistOnly: Boolean(r.whitelist_only),
    requireSocialProof: Boolean(r.exige_social_proof),
    materialsSummary: r.materiais_resumo ?? "",
    coverAssetMode: (r.capa_modo as "link" | "file") ?? "link",
    coverAssetUrl: r.capa_url ?? "",
    coverAssetName: r.capa_nome ?? "",
    promoAssetMode: (r.promo_modo as "link" | "file") ?? "link",
    promoAssetUrl: r.promo_url ?? "",
    promoAssetName: r.promo_nome ?? "",
    checkoutColor: r.checkout_cor ?? "#dc2626",
    checkoutBannerMode: (r.checkout_banner_modo as "link" | "file") ?? "link",
    checkoutBannerUrl: r.checkout_banner_url ?? "",
    checkoutBannerName: r.checkout_banner_nome ?? "",
    checkoutHeadline: r.checkout_headline ?? "",
    checkoutSubheadline: r.checkout_subheadline ?? "",
    checkoutCtaLabel: r.checkout_cta ?? "Comprar agora",
    checkoutGuaranteeText: r.checkout_garantia ?? "",
    checkoutSupportText: r.checkout_suporte ?? "",
    checkoutHighlights: r.checkout_highlights ?? "",
    supportEmail: r.suporte_email ?? "suporte@mundomapping.com",
    logisticsMode: (r.logistica_modo as ProductRecord["logisticsMode"]) ?? "digital",
    stockRequired: Boolean(r.estoque_requerido),
    shippingManagedBy: (r.frete_gerido_por as ProductRecord["shippingManagedBy"]) ?? "na",
    bookingRequired: Boolean(r.reserva_requerida),
    noShowPolicy: r.politica_no_show ?? "",
    createdAt: r.criado_em ?? new Date().toISOString(),
    updatedAt: r.atualizado_em ?? new Date().toISOString(),
  };
}

function toRow(input: ProductInput, userId: string, empresaNome?: string) {
  return {
    empresa_id: userId,
    empresa_nome: empresaNome ?? null,
    nome: input.name,
    marca: input.brand,
    categoria: input.category,
    descricao: input.description,
    url_produto: input.checkoutUrl,
    preco: input.price,
    comissao_tipo: input.commissionType,
    comissao_valor: input.commissionValue,
    comissao_base: input.commissionBase,
    garantia_dias: input.guaranteeDays,
    liberacao_dias: input.releaseDays,
    payout_mode: input.payoutMode,
    attribution_model: input.attributionModel,
    attribution_window_dias: input.attributionWindowDays,
    cupom_habilitado: input.couponEnabled,
    aprovacao_modo: input.approvalMode,
    visivel_shopping: input.visibleInShopping,
    status: input.status,
    publico: input.audience,
    score_minimo: input.minimumCreatorScore,
    seguidores_minimo: input.minimumFollowers,
    regioes_permitidas: input.allowedRegions,
    whitelist_only: input.whitelistOnly,
    exige_social_proof: input.requireSocialProof,
    materiais_resumo: input.materialsSummary,
    capa_modo: input.coverAssetMode,
    capa_url: input.coverAssetUrl,
    capa_nome: input.coverAssetName,
    promo_modo: input.promoAssetMode,
    promo_url: input.promoAssetUrl,
    promo_nome: input.promoAssetName,
    checkout_cor: input.checkoutColor,
    checkout_banner_modo: input.checkoutBannerMode,
    checkout_banner_url: input.checkoutBannerUrl,
    checkout_banner_nome: input.checkoutBannerName,
    checkout_headline: input.checkoutHeadline,
    checkout_subheadline: input.checkoutSubheadline,
    checkout_cta: input.checkoutCtaLabel,
    checkout_garantia: input.checkoutGuaranteeText,
    checkout_suporte: input.checkoutSupportText,
    checkout_highlights: input.checkoutHighlights,
    suporte_email: input.supportEmail,
    logistica_modo: input.logisticsMode,
    estoque_requerido: input.stockRequired,
    frete_gerido_por: input.shippingManagedBy,
    reserva_requerida: input.bookingRequired,
    politica_no_show: input.noShowPolicy,
  };
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function ensureUniqueSlug(base: string, existing: ProductRecord[], currentSlug?: string) {
  let slug = base || "produto";
  let suffix = 2;
  while (existing.some((p) => p.slug === slug && p.slug !== currentSlug)) {
    slug = `${base}-${suffix}`;
    suffix++;
  }
  return slug;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProductStoreContext = createContext<ProductStoreValue | null>(null);

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState<string | undefined>();

  const fetchProducts = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", uid)
      .order("criado_em", { ascending: false });
    setProducts((data ?? []).map(fromRow));
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setReady(true); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, full_name")
        .eq("id", user.id)
        .single();
      setEmpresaNome(profile?.company_name ?? profile?.full_name ?? undefined);

      await fetchProducts(user.id);
      setReady(true);
    }
    init();
  }, [fetchProducts]);

  const value = useMemo<ProductStoreValue>(() => ({
    products,
    ready,

    async createProduct(input, publish = false) {
      if (!userId) return null;
      const supabase = createClient();
      const slug = ensureUniqueSlug(slugify(input.name), products);
      const { data, error } = await supabase
        .from("produtos")
        .insert({
          ...toRow(input, userId, empresaNome),
          slug,
          status: publish ? "published" : input.status,
        })
        .select()
        .single();
      if (error || !data) return null;
      const record = fromRow(data);
      setProducts((prev) => [record, ...prev]);
      return record;
    },

    async updateProduct(slug, input, publish = false) {
      if (!userId) return null;
      const existing = products.find((p) => p.slug === slug);
      if (!existing) return null;
      const supabase = createClient();
      const nextSlug = ensureUniqueSlug(slugify(input.name), products, slug);
      const { data, error } = await supabase
        .from("produtos")
        .update({
          ...toRow(input, userId, empresaNome),
          slug: nextSlug,
          status: publish ? "published" : input.status,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error || !data) return null;
      const record = fromRow(data);
      setProducts((prev) => prev.map((p) => (p.id === existing.id ? record : p)));
      return record;
    },

    setProductStatus(slug, status) {
      const existing = products.find((p) => p.slug === slug);
      if (!existing) return;
      // optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === existing.id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
      );
      const supabase = createClient();
      supabase
        .from("produtos")
        .update({ status, atualizado_em: new Date().toISOString() })
        .eq("id", existing.id)
        .then(() => {});
    },

    deleteProduct(slug) {
      const existing = products.find((p) => p.slug === slug);
      if (!existing) return;
      // optimistic update
      setProducts((prev) => prev.filter((p) => p.id !== existing.id));
      const supabase = createClient();
      supabase.from("produtos").delete().eq("id", existing.id).then(() => {});
    },

    getProductBySlug: (slug) => products.find((p) => p.slug === slug),
  }), [products, ready, userId, empresaNome]);

  return <ProductStoreContext.Provider value={value}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const context = useContext(ProductStoreContext);
  if (!context) throw new Error("useProductStore must be used within ProductStoreProvider");
  return context;
}

export function getEmptyProduct(): ProductInput {
  return {
    name: "",
    brand: "Mundo Mapping",
    category: "Infoproduto | Ebook",
    price: 0,
    checkoutUrl: "",
    empresaId: "",
    commissionType: "percent",
    commissionValue: 20,
    commissionBase: "gross",
    guaranteeDays: 14,
    releaseDays: 14,
    payoutMode: "platform_ledger",
    attributionModel: "last_click",
    attributionWindowDays: 7,
    couponEnabled: true,
    approvalMode: "manual",
    visibleInShopping: true,
    status: "draft",
    description: "",
    audience: "",
    minimumCreatorScore: 70,
    minimumFollowers: 5000,
    allowedRegions: "Brasil",
    whitelistOnly: false,
    requireSocialProof: false,
    materialsSummary: "",
    coverAssetMode: "link",
    coverAssetUrl: "",
    coverAssetName: "",
    promoAssetMode: "link",
    promoAssetUrl: "",
    promoAssetName: "",
    checkoutColor: "#dc2626",
    checkoutBannerMode: "link",
    checkoutBannerUrl: "",
    checkoutBannerName: "",
    checkoutHeadline: "",
    checkoutSubheadline: "",
    checkoutCtaLabel: "Comprar agora",
    checkoutGuaranteeText: "",
    checkoutSupportText: "",
    checkoutHighlights: "",
    supportEmail: "suporte@mundomapping.com",
    logisticsMode: "digital",
    stockRequired: false,
    shippingManagedBy: "na",
    bookingRequired: false,
    noShowPolicy: "",
  };
}
