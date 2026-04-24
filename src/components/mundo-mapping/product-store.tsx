"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

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
  createProduct: (input: ProductInput, publish?: boolean) => ProductRecord;
  updateProduct: (slug: string, input: ProductInput, publish?: boolean) => ProductRecord | null;
  setProductStatus: (slug: string, status: ProductStatus) => void;
  getProductBySlug: (slug: string) => ProductRecord | undefined;
};

const STORAGE_KEY = "mundo-mapping-affiliates-products";

function createBaseProduct(partial: Partial<ProductRecord>): ProductRecord {
  return {
    id: partial.id ?? `prod_${crypto.randomUUID()}`,
    slug: partial.slug ?? "produto",
    name: partial.name ?? "",
    brand: partial.brand ?? "Mundo Mapping",
    category: partial.category ?? "Infoproduto | Ebook",
    price: partial.price ?? 0,
    commissionType: partial.commissionType ?? "percent",
    commissionValue: partial.commissionValue ?? 20,
    commissionBase: partial.commissionBase ?? "gross",
    guaranteeDays: normalizeGuaranteeDays(partial.guaranteeDays ?? 14),
    releaseDays: Math.max(7, partial.releaseDays ?? 14),
    payoutMode: partial.payoutMode ?? "platform_ledger",
    attributionModel: partial.attributionModel ?? "last_click",
    attributionWindowDays: Math.max(1, partial.attributionWindowDays ?? 7),
    couponEnabled: partial.couponEnabled ?? true,
    approvalMode: partial.approvalMode ?? "manual",
    visibleInShopping: partial.visibleInShopping ?? true,
    status: partial.status ?? "draft",
    description: partial.description ?? "",
    audience: partial.audience ?? "",
    minimumCreatorScore: partial.minimumCreatorScore ?? 70,
    minimumFollowers: partial.minimumFollowers ?? 5000,
    allowedRegions: partial.allowedRegions ?? "Brasil",
    whitelistOnly: partial.whitelistOnly ?? false,
    requireSocialProof: partial.requireSocialProof ?? false,
    materialsSummary: partial.materialsSummary ?? "",
    coverAssetMode: partial.coverAssetMode ?? "link",
    coverAssetUrl: partial.coverAssetUrl ?? "",
    coverAssetName: partial.coverAssetName ?? "",
    promoAssetMode: partial.promoAssetMode ?? "link",
    promoAssetUrl: partial.promoAssetUrl ?? "",
    promoAssetName: partial.promoAssetName ?? "",
    checkoutColor: partial.checkoutColor ?? "#dc2626",
    checkoutBannerMode: partial.checkoutBannerMode ?? "link",
    checkoutBannerUrl: partial.checkoutBannerUrl ?? "",
    checkoutBannerName: partial.checkoutBannerName ?? "",
    checkoutHeadline: partial.checkoutHeadline ?? "",
    checkoutSubheadline: partial.checkoutSubheadline ?? "",
    checkoutCtaLabel: partial.checkoutCtaLabel ?? "Comprar agora",
    checkoutGuaranteeText: partial.checkoutGuaranteeText ?? "",
    checkoutSupportText: partial.checkoutSupportText ?? "",
    checkoutHighlights: partial.checkoutHighlights ?? "",
    supportEmail: partial.supportEmail ?? "suporte@mundomapping.com",
    logisticsMode: partial.logisticsMode ?? "digital",
    stockRequired: partial.stockRequired ?? false,
    shippingManagedBy: partial.shippingManagedBy ?? "na",
    bookingRequired: partial.bookingRequired ?? false,
    noShowPolicy: partial.noShowPolicy ?? "",
    createdAt: partial.createdAt ?? new Date().toISOString(),
    updatedAt: partial.updatedAt ?? new Date().toISOString()
  };
}

const defaultProducts: ProductRecord[] = [
  createBaseProduct({
    id: "prod_1",
    slug: "mapa-360-pro",
    name: "Mapa 360 Pro",
    brand: "Mundo Mapping",
    category: "Cursos",
    price: 890,
    commissionType: "percent",
    commissionValue: 20,
    commissionBase: "gross",
    guaranteeDays: 14,
    releaseDays: 14,
    payoutMode: "platform_ledger",
    attributionModel: "hybrid",
    attributionWindowDays: 14,
    couponEnabled: true,
    approvalMode: "manual",
    visibleInShopping: true,
    status: "published",
    description: "Produto premium com foco em posicionamento, performance comercial e distribuicao via afiliados.",
    audience: "Empreendedores, especialistas e times comerciais",
    minimumCreatorScore: 78,
    minimumFollowers: 15000,
    allowedRegions: "Brasil, Sudeste e capitais",
    requireSocialProof: true,
    materialsSummary: "Pack de story, feed, video curto e banner de checkout.",
    coverAssetMode: "link",
    coverAssetUrl: "https://assets.mundomapping.com/produtos/mapa-360/capa.jpg",
    promoAssetMode: "file",
    promoAssetName: "pack-story-mapa-360.zip",
    checkoutColor: "#dc2626",
    checkoutBannerMode: "link",
    checkoutBannerUrl: "https://assets.mundomapping.com/produtos/mapa-360/banner-checkout.jpg",
    checkoutHeadline: "Mapa 360 Pro para empresas que querem crescer com afiliados",
    checkoutSubheadline: "Checkout limpo, confiavel e orientado para conversao com identidade da Mundo Mapping.",
    checkoutCtaLabel: "Quero ativar agora",
    checkoutGuaranteeText: "Garantia de 14 dias para reduzir friccao na decisao.",
    checkoutSupportText: "Suporte por email em horario comercial.",
    checkoutHighlights: "Acesso imediato\nMateriais prontos para afiliados\nCheckout com identidade da marca",
    supportEmail: "suporte@mundomapping.com",
    logisticsMode: "service",
    bookingRequired: false,
    noShowPolicy: "Nao se aplica"
  }),
  createBaseProduct({
    id: "prod_2",
    slug: "o-que-as-marcas-querem",
    name: "O Que as Marcas Querem",
    brand: "Mundo Mapping",
    category: "Infoproduto | Ebook",
    price: 19.9,
    commissionType: "percent",
    commissionValue: 50,
    commissionBase: "gross",
    guaranteeDays: 7,
    releaseDays: 7,
    payoutMode: "platform_split",
    attributionModel: "coupon_priority",
    attributionWindowDays: 7,
    couponEnabled: true,
    approvalMode: "automatic",
    visibleInShopping: true,
    status: "published",
    description: "Produto de entrada com alta taxa de conversao e materiais simples para afiliados.",
    audience: "Influenciadores iniciantes e publico de marketing",
    minimumCreatorScore: 62,
    minimumFollowers: 2000,
    allowedRegions: "Brasil",
    materialsSummary: "Criativos para stories, carrossel e pagina de venda enxuta.",
    coverAssetMode: "file",
    coverAssetName: "capa-o-que-as-marcas-querem.png",
    promoAssetMode: "link",
    promoAssetUrl: "https://assets.mundomapping.com/produtos/marcas-querem/materiais",
    checkoutColor: "#111827",
    checkoutBannerMode: "file",
    checkoutBannerName: "banner-checkout-marcas.png",
    checkoutHeadline: "Descubra o que as marcas realmente querem dos influenciadores",
    checkoutSubheadline: "Uma oferta de entrada simples, direta e com alta chance de conversao.",
    checkoutCtaLabel: "Comprar agora",
    checkoutGuaranteeText: "Garantia de 7 dias.",
    checkoutSupportText: "Atendimento por email e pagina de ajuda.",
    checkoutHighlights: "Leitura rapida\nProduto digital\nEntrega imediata",
    supportEmail: "suporte@mundomapping.com",
    logisticsMode: "digital"
  })
];

const ProductStoreContext = createContext<ProductStoreValue | null>(null);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function ensureUniqueSlug(baseSlug: string, products: ProductRecord[], currentSlug?: string) {
  let slug = baseSlug || "produto";
  let suffix = 2;

  while (products.some((product) => product.slug === slug && product.slug !== currentSlug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function normalizeGuaranteeDays(value: number) {
  return Math.max(7, Number.isFinite(value) ? value : 7);
}

function normalizeProduct(product: Partial<ProductRecord>) {
  return createBaseProduct(product);
}

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductRecord[]>(defaultProducts);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProductRecord[];
        if (Array.isArray(parsed) && parsed.length) {
          setProducts(parsed.map((item) => normalizeProduct(item)));
        }
      }
    } catch {
      setProducts(defaultProducts);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products, ready]);

  const value = useMemo<ProductStoreValue>(
    () => ({
      products,
      ready,
      createProduct: (input, publish = false) => {
        const now = new Date().toISOString();
        const baseSlug = slugify(input.name);
        const slug = ensureUniqueSlug(baseSlug, products);
        const record: ProductRecord = {
          ...normalizeProduct(input),
          id: `prod_${crypto.randomUUID()}`,
          slug,
          status: publish ? "published" : input.status,
          createdAt: now,
          updatedAt: now
        } as ProductRecord;
        setProducts((current) => [record, ...current]);
        return record;
      },
      updateProduct: (slug, input, publish = false) => {
        let updated: ProductRecord | null = null;
        setProducts((current) =>
          current.map((product) => {
            if (product.slug !== slug) return product;
            const nextSlug = ensureUniqueSlug(slugify(input.name), current, slug);
            updated = normalizeProduct({
              ...product,
              ...input,
              slug: nextSlug,
              status: publish ? "published" : input.status,
              updatedAt: new Date().toISOString()
            });
            return updated;
          })
        );
        return updated;
      },
      setProductStatus: (slug, status) => {
        setProducts((current) =>
          current.map((product) =>
            product.slug === slug ? { ...product, status, updatedAt: new Date().toISOString() } : product
          )
        );
      },
      getProductBySlug: (slug) => products.find((product) => product.slug === slug)
    }),
    [products, ready]
  );

  return <ProductStoreContext.Provider value={value}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const context = useContext(ProductStoreContext);

  if (!context) {
    throw new Error("useProductStore must be used within ProductStoreProvider");
  }

  return context;
}

export function getEmptyProduct(): ProductInput {
  return {
    name: "",
    brand: "Mundo Mapping",
    category: "Infoproduto | Ebook",
    price: 0,
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
    noShowPolicy: ""
  };
}
