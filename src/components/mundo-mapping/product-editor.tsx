"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MetricCard,
  MiniStat,
  PageHeader,
  ProductVisualCard,
  SectionCard,
  StatusBadge
} from "@/components/mundo-mapping/affiliate-ui";
import { getEmptyProduct, ProductInput, ProductRecord, PRODUCT_TYPE_OPTIONS, useProductStore } from "@/components/mundo-mapping/product-store";

const steps = [
  "Informações principais",
  "Precificação e comissão",
  "Segmentação de afiliados",
  "Materiais de divulgação",
  "Checkout e branding",
  "Regras operacionais",
  "Revisão e publicação"
];

function Field({
  label,
  helper,
  children
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {helper ? <p className="mt-2 text-xs leading-5 text-zinc-500">{helper}</p> : null}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  min
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
}) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      min={min}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  rows = 5
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      value={value}
    />
  );
}

function AssetField({
  label,
  helper,
  mode,
  url,
  fileName,
  onModeChange,
  onUrlChange,
  onFileChange
}: {
  label: string;
  helper?: string;
  mode: "link" | "file";
  url: string;
  fileName: string;
  onModeChange: (value: "link" | "file") => void;
  onUrlChange: (value: string) => void;
  onFileChange: (fileName: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-700">{label}</p>
          {helper ? <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p> : null}
        </div>
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
          {[
            { label: "Link", value: "link" as const },
            { label: "Arquivo", value: "file" as const }
          ].map((option) => (
            <button
              className={option.value === mode ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-500"}
              key={option.value}
              onClick={() => onModeChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "link" ? (
        <div className="mt-4">
          <Input onChange={onUrlChange} placeholder="https://..." value={url} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <input
            accept="image/*,.pdf,.zip"
            className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-xl file:border-0 file:bg-red-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-red-700"
            onChange={(event) => onFileChange(event.target.files?.[0]?.name ?? "")}
            type="file"
          />
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            {fileName ? `Arquivo selecionado: ${fileName}` : "Nenhum arquivo selecionado."}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductEditor({
  mode,
  initialProduct
}: {
  mode: "create" | "edit";
  initialProduct?: ProductRecord;
}) {
  const router = useRouter();
  const { createProduct, updateProduct } = useProductStore();
  const [activeStep, setActiveStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(initialProduct ?? getEmptyProduct());

  const commissionEstimate = useMemo(() => {
    if (form.commissionType === "fixed") return form.commissionValue;
    return (form.price * form.commissionValue) / 100;
  }, [form.commissionType, form.commissionValue, form.price]);

  const netEstimate = useMemo(() => Math.max(form.price - commissionEstimate, 0), [commissionEstimate, form.price]);
  const readinessChecklist = useMemo(
    () => [
      { label: "Nome do produto", done: Boolean(form.name.trim()) },
      { label: "Descrição comercial", done: Boolean(form.description.trim()) },
      { label: "Comissão definida", done: form.commissionValue > 0 },
      { label: "Janela de garantia válida", done: form.guaranteeDays >= 7 },
      { label: "Prazo de liberação definido", done: form.releaseDays >= 7 },
      { label: "Regras de atribuição definidas", done: Boolean(form.attributionModel) && form.attributionWindowDays > 0 },
      { label: "Critérios de creator definidos", done: form.minimumCreatorScore > 0 && form.minimumFollowers >= 0 },
      { label: "Materiais ou capa informados", done: Boolean(form.materialsSummary.trim() || form.coverAssetUrl || form.coverAssetName) },
      { label: "Checkout configurado", done: Boolean(form.checkoutHeadline.trim() && form.checkoutCtaLabel.trim()) }
    ],
    [form]
  );

  function patch<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goToStep(direction: "next" | "prev") {
    setActiveStep((current) => {
      if (direction === "next") return Math.min(current + 1, steps.length - 1);
      return Math.max(current - 1, 0);
    });
  }

  function save(publish = false) {
    const normalized: ProductInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      audience: form.audience.trim(),
      materialsSummary: form.materialsSummary.trim(),
      guaranteeDays: Math.max(7, form.guaranteeDays || 0),
      status: publish ? "published" : "draft"
    };

    if (!normalized.name) {
      setFeedback("Preencha o nome do produto para continuar.");
      return;
    }

    if (normalized.guaranteeDays < 7) {
      setFeedback("A janela de garantia deve ser de no mínimo 7 dias.");
      return;
    }

    const result =
      mode === "create"
        ? createProduct(normalized, publish)
        : updateProduct(initialProduct!.slug, normalized, publish);

    if (!result) {
      setFeedback("Não foi possível salvar o produto.");
      return;
    }

    setFeedback(publish ? "Produto publicado com sucesso." : "Rascunho salvo com sucesso.");
    router.push(`/mundo-mapping/afiliados/produtos/${result.slug}`);
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700"
              onClick={() => save(false)}
              type="button"
            >
              Salvar rascunho
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]"
              onClick={() => save(true)}
              type="button"
            >
              {mode === "create" ? "Publicar produto" : "Atualizar produto"}
            </button>
          </>
        }
        description="Fluxo funcional de cadastro em etapas, com rascunho, publicação e preview persistido dentro do próprio módulo."
        eyebrow={`Mundo Mapping / Afiliados / Produtos / ${mode === "create" ? "Novo produto" : "Editar produto"}`}
        title={mode === "create" ? "Cadastro de produto em etapas" : `Editar produto: ${initialProduct?.name ?? ""}`}
      />

      <div className="grid gap-6 p-6 xl:grid-cols-[280px_1fr_340px]">
        <SectionCard subtitle="Fluxo orientado, com clareza do que falta concluir." title="Etapas do produto" className="h-fit">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <button
                className={`block w-full rounded-2xl border p-4 text-left ${index === activeStep ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"}`}
                key={step}
                onClick={() => setActiveStep(index)}
                type="button"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Etapa {index + 1}</p>
                <p className={`mt-2 font-semibold ${index === activeStep ? "text-red-700" : "text-zinc-800"}`}>{step}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          action={<StatusBadge label={form.status === "published" ? "Publicado" : "Rascunho"} tone={form.status === "published" ? "success" : "warning"} />}
          subtitle="Todos os campos desta tela estão funcionando e salvam no navegador para você testar o processo inteiro."
          title={`Etapa ${activeStep + 1}. ${steps[activeStep]}`}
        >
          {feedback ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

          {activeStep === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field helper="Nome que aparece no hub, no shopping e nos relatórios." label="Nome do produto">
                <Input onChange={(value) => patch("name", value)} placeholder="Ex.: Mapa 360 Pro" value={form.name} />
              </Field>
              <Field label="Marca">
                <Input onChange={(value) => patch("brand", value)} value={form.brand} />
              </Field>
              <Field helper="Selecione um dos tipos aceitos pela plataforma." label="Tipo de produto">
                <Select
                  onChange={(value) => patch("category", value)}
                  options={PRODUCT_TYPE_OPTIONS.map((option) => ({ label: option, value: option }))}
                  value={form.category}
                />
              </Field>
              <Field label="Email de suporte">
                <Input onChange={(value) => patch("supportEmail", value)} type="email" value={form.supportEmail} />
              </Field>
              <div className="md:col-span-2">
              <Field helper="Texto principal usado no detalhe do produto e no shopping." label="Descrição">
                <Textarea onChange={(value) => patch("description", value)} rows={6} value={form.description} />
              </Field>
              </div>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Preço do produto">
                <Input onChange={(value) => patch("price", Number(value) || 0)} type="number" value={form.price} />
              </Field>
              <Field label="Modelo de comissão">
                <Select
                  onChange={(value) => patch("commissionType", value as ProductInput["commissionType"])}
                  options={[
                    { label: "Percentual sobre a venda", value: "percent" },
                    { label: "Valor fixo por venda", value: "fixed" }
                  ]}
                  value={form.commissionType}
                />
              </Field>
              <Field label={form.commissionType === "percent" ? "Percentual do afiliado" : "Valor fixo da comissão"}>
                <Input onChange={(value) => patch("commissionValue", Number(value) || 0)} type="number" value={form.commissionValue} />
              </Field>
              <Field helper="Mínimo obrigatório de 7 dias." label="Janela de garantia (dias)">
                <Input min={7} onChange={(value) => patch("guaranteeDays", Math.max(7, Number(value) || 0))} type="number" value={form.guaranteeDays} />
              </Field>
              <Field helper="Prazo entre venda válida e saldo elegível para saque." label="Liberação da comissão (dias)">
                <Input min={7} onChange={(value) => patch("releaseDays", Math.max(7, Number(value) || 0))} type="number" value={form.releaseDays} />
              </Field>
              <Field label="Base de cálculo da comissão">
                <Select
                  onChange={(value) => patch("commissionBase", value as ProductInput["commissionBase"])}
                  options={[
                    { label: "Valor bruto da venda", value: "gross" },
                    { label: "Valor líquido", value: "net" },
                    { label: "Líquido sem frete", value: "net_without_freight" }
                  ]}
                  value={form.commissionBase}
                />
              </Field>
              <Field label="Modo financeiro">
                <Select
                  onChange={(value) => patch("payoutMode", value as ProductInput["payoutMode"])}
                  options={[
                    { label: "Ledger da plataforma", value: "platform_ledger" },
                    { label: "Split na plataforma", value: "platform_split" }
                  ]}
                  value={form.payoutMode}
                />
              </Field>
              <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
                <MetricCard label="Comissão estimada" meta="Por venda confirmada" value={`R$ ${commissionEstimate.toFixed(2)}`} />
                <MetricCard label="Preço" meta="Valor final da venda" value={`R$ ${form.price.toFixed(2)}`} />
                <MetricCard emphasis label="Líquido estimado" meta="Sem taxa da plataforma" value={`R$ ${netEstimate.toFixed(2)}`} />
              </div>
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field helper="Quem deve ser priorizado para afiliação." label="Público ideal">
                <Textarea onChange={(value) => patch("audience", value)} rows={6} value={form.audience} />
              </Field>
              <Field label="Aprovação da afiliação">
                <Select
                  onChange={(value) => patch("approvalMode", value as ProductInput["approvalMode"])}
                  options={[
                    { label: "Manual", value: "manual" },
                    { label: "Automática", value: "automatic" }
                  ]}
                  value={form.approvalMode}
                />
              </Field>
              <Field helper="Nota mínima do creator dentro da base validada da plataforma." label="Score mínimo do creator">
                <Input onChange={(value) => patch("minimumCreatorScore", Number(value) || 0)} type="number" value={form.minimumCreatorScore} />
              </Field>
              <Field label="Seguidores mínimos">
                <Input onChange={(value) => patch("minimumFollowers", Number(value) || 0)} type="number" value={form.minimumFollowers} />
              </Field>
              <Field helper="Separar por país, estado, cidade ou regra comercial." label="Regiões elegíveis">
                <Input onChange={(value) => patch("allowedRegions", value)} value={form.allowedRegions} />
              </Field>
              <Field label="Whitelist de creators">
                <Select
                  onChange={(value) => patch("whitelistOnly", value === "true")}
                  options={[
                    { label: "Aberto para a base elegível", value: "false" },
                    { label: "Somente whitelist", value: "true" }
                  ]}
                  value={String(form.whitelistOnly)}
                />
              </Field>
              <Field label="Exigir histórico validado">
                <Select
                  onChange={(value) => patch("requireSocialProof", value === "true")}
                  options={[
                    { label: "Não", value: "false" },
                    { label: "Sim", value: "true" }
                  ]}
                  value={String(form.requireSocialProof)}
                />
              </Field>
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-5">
              <Field helper="Descreva o pacote de criativos disponível para os afiliados." label="Materiais de divulgação">
                <Textarea onChange={(value) => patch("materialsSummary", value)} rows={6} value={form.materialsSummary} />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <AssetField
                  fileName={form.coverAssetName}
                  helper="Use a capa principal do produto. Pode ser um link externo ou um arquivo."
                  label="Capa do produto"
                  mode={form.coverAssetMode}
                  onFileChange={(value) => patch("coverAssetName", value)}
                  onModeChange={(value) => patch("coverAssetMode", value)}
                  onUrlChange={(value) => patch("coverAssetUrl", value)}
                  url={form.coverAssetUrl}
                />
                <AssetField
                  fileName={form.promoAssetName}
                  helper="Materiais para divulgação como stories, feed, kit de mídia ou pacote zip."
                  label="Materiais promocionais"
                  mode={form.promoAssetMode}
                  onFileChange={(value) => patch("promoAssetName", value)}
                  onModeChange={(value) => patch("promoAssetMode", value)}
                  onUrlChange={(value) => patch("promoAssetUrl", value)}
                  url={form.promoAssetUrl}
                />
              </div>
            </div>
          ) : null}

          {activeStep === 4 ? (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Cor principal do checkout">
                  <Input onChange={(value) => patch("checkoutColor", value)} value={form.checkoutColor} />
                </Field>
                <Field label="Mostrar no shopping de afiliados">
                  <Select
                    onChange={(value) => patch("visibleInShopping", value === "true")}
                    options={[
                      { label: "Sim", value: "true" },
                      { label: "Não", value: "false" }
                    ]}
                    value={String(form.visibleInShopping)}
                  />
                </Field>
                <Field helper="Título principal da área hero do checkout." label="Headline">
                  <Input onChange={(value) => patch("checkoutHeadline", value)} value={form.checkoutHeadline} />
                </Field>
                <Field helper="Texto de apoio abaixo da headline." label="Subheadline">
                  <Input onChange={(value) => patch("checkoutSubheadline", value)} value={form.checkoutSubheadline} />
                </Field>
                <Field label="Texto do CTA principal">
                  <Input onChange={(value) => patch("checkoutCtaLabel", value)} value={form.checkoutCtaLabel} />
                </Field>
                <Field label="Texto de garantia">
                  <Input onChange={(value) => patch("checkoutGuaranteeText", value)} value={form.checkoutGuaranteeText} />
                </Field>
                <div className="md:col-span-2">
                  <Field helper="Benefícios do checkout, um item por linha." label="Highlights do checkout">
                    <Textarea onChange={(value) => patch("checkoutHighlights", value)} rows={5} value={form.checkoutHighlights} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field helper="Texto exibido abaixo do CTA com suporte ou instruções finais." label="Texto de suporte">
                    <Textarea onChange={(value) => patch("checkoutSupportText", value)} rows={4} value={form.checkoutSupportText} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <AssetField
                    fileName={form.checkoutBannerName}
                    helper="Banner do checkout. Pode ser um link hospedado externamente ou um arquivo local."
                    label="Banner do checkout"
                    mode={form.checkoutBannerMode}
                    onFileChange={(value) => patch("checkoutBannerName", value)}
                    onModeChange={(value) => patch("checkoutBannerMode", value)}
                    onUrlChange={(value) => patch("checkoutBannerUrl", value)}
                    url={form.checkoutBannerUrl}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Preview do checkout</p>
                    <p className="mt-1 text-sm text-zinc-500">Edição completa com resposta visual imediata.</p>
                  </div>
                  <StatusBadge label="Preview" tone="neutral" />
                </div>
                <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
                  <div className="p-6" style={{ backgroundColor: `${form.checkoutColor}12` }}>
                    <div className="h-2 w-28 rounded-full" style={{ backgroundColor: form.checkoutColor }} />
                    <h3 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
                      {form.checkoutHeadline || "Headline principal do checkout"}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                      {form.checkoutSubheadline || "Subheadline do checkout para reforcar seguranca, proposta de valor e conversao."}
                      
                    </p>
                  </div>
                  <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-2xl border border-zinc-200 p-5">
                      <p className="text-sm font-semibold text-zinc-900">O que o comprador recebe</p>
                      <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                        {(form.checkoutHighlights || "Acesso imediato\nAmbiente profissional\nGarantia e suporte")
                          .split("\n")
                          .filter(Boolean)
                          .map((item) => (
                            <li className="flex items-start gap-3" key={item}>
                              <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: form.checkoutColor }} />
                              <span>{item}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 p-5">
                      <p className="text-sm text-zinc-500">Investimento</p>
                      <p className="mt-2 text-3xl font-semibold text-zinc-950">R$ {form.price.toFixed(2)}</p>
                      <button
                        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                        style={{ backgroundColor: form.checkoutColor }}
                        type="button"
                      >
                        {form.checkoutCtaLabel || "Comprar agora"}
                      </button>
                      <p className="mt-4 text-sm leading-6 text-zinc-600">
                        {form.checkoutGuaranteeText || "Texto de garantia ainda não informado."}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {form.checkoutSupportText || "Texto de suporte e instruções do checkout."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeStep === 5 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Status inicial">
                <Select
                  onChange={(value) => patch("status", value as ProductInput["status"])}
                  options={[
                    { label: "Rascunho", value: "draft" },
                    { label: "Publicado", value: "published" },
                    { label: "Pausado", value: "paused" }
                  ]}
                  value={form.status}
                />
              </Field>
              <Field label="Visibilidade operacional">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  {form.visibleInShopping ? "Produto visível no shopping e no hub de afiliados." : "Produto restrito ao uso interno ou por convite."}
                </div>
              </Field>
              <Field label="Modelo de atribuição">
                <Select
                  onChange={(value) => patch("attributionModel", value as ProductInput["attributionModel"])}
                  options={[
                    { label: "Último clique", value: "last_click" },
                    { label: "Cupom com prioridade", value: "coupon_priority" },
                    { label: "Modelo híbrido", value: "hybrid" }
                  ]}
                  value={form.attributionModel}
                />
              </Field>
              <Field label="Janela de atribuição (dias)">
                <Input min={1} onChange={(value) => patch("attributionWindowDays", Math.max(1, Number(value) || 1))} type="number" value={form.attributionWindowDays} />
              </Field>
              <Field label="Cupom habilitado">
                <Select
                  onChange={(value) => patch("couponEnabled", value === "true")}
                  options={[
                    { label: "Sim", value: "true" },
                    { label: "Não", value: "false" }
                  ]}
                  value={String(form.couponEnabled)}
                />
              </Field>
              <Field label="Modelo logístico">
                <Select
                  onChange={(value) => patch("logisticsMode", value as ProductInput["logisticsMode"])}
                  options={[
                    { label: "Digital", value: "digital" },
                    { label: "Físico", value: "physical" },
                    { label: "Serviço", value: "service" },
                    { label: "Diária", value: "daily" }
                  ]}
                  value={form.logisticsMode}
                />
              </Field>
              <Field label="Controle de estoque">
                <Select
                  onChange={(value) => patch("stockRequired", value === "true")}
                  options={[
                    { label: "Não", value: "false" },
                    { label: "Sim", value: "true" }
                  ]}
                  value={String(form.stockRequired)}
                />
              </Field>
              <Field label="Frete gerido por">
                <Select
                  onChange={(value) => patch("shippingManagedBy", value as ProductInput["shippingManagedBy"])}
                  options={[
                    { label: "Não se aplica", value: "na" },
                    { label: "Empresa", value: "company" },
                    { label: "Cliente", value: "customer" }
                  ]}
                  value={form.shippingManagedBy}
                />
              </Field>
              <Field label="Exige agenda ou reserva">
                <Select
                  onChange={(value) => patch("bookingRequired", value === "true")}
                  options={[
                    { label: "Não", value: "false" },
                    { label: "Sim", value: "true" }
                  ]}
                  value={String(form.bookingRequired)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field helper="Use para diária, serviço presencial ou políticas de falta/cancelamento." label="Política de no-show / execução">
                  <Textarea onChange={(value) => patch("noShowPolicy", value)} rows={4} value={form.noShowPolicy} />
                </Field>
              </div>
            </div>
          ) : null}

          {activeStep === 6 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <MiniStat label="Nome" value={form.name || "-"} />
                <MiniStat label="Preço" value={`R$ ${form.price.toFixed(2)}`} />
                <MiniStat label="Comissão" value={form.commissionType === "percent" ? `${form.commissionValue}%` : `R$ ${form.commissionValue.toFixed(2)}`} />
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4 text-sm leading-6 text-zinc-600">
                <p><strong className="text-zinc-900">Descrição:</strong> {form.description || "Sem descrição informada."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Público:</strong> {form.audience || "Sem segmentação informada."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Score mínimo:</strong> {form.minimumCreatorScore}</p>
                <p className="mt-3"><strong className="text-zinc-900">Seguidores mínimos:</strong> {form.minimumFollowers}</p>
                <p className="mt-3"><strong className="text-zinc-900">Modelo de atribuição:</strong> {form.attributionModel}</p>
                <p className="mt-3"><strong className="text-zinc-900">Janela de atribuição:</strong> {form.attributionWindowDays} dias</p>
                <p className="mt-3"><strong className="text-zinc-900">Base da comissão:</strong> {form.commissionBase}</p>
                <p className="mt-3"><strong className="text-zinc-900">Liberação da comissão:</strong> {form.releaseDays} dias</p>
                <p className="mt-3"><strong className="text-zinc-900">Materiais:</strong> {form.materialsSummary || "Sem materiais informados."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Capa:</strong> {form.coverAssetMode === "link" ? form.coverAssetUrl || "Sem link informado." : form.coverAssetName || "Sem arquivo informado."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Materiais promocionais:</strong> {form.promoAssetMode === "link" ? form.promoAssetUrl || "Sem link informado." : form.promoAssetName || "Sem arquivo informado."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Banner do checkout:</strong> {form.checkoutBannerMode === "link" ? form.checkoutBannerUrl || "Sem link informado." : form.checkoutBannerName || "Sem arquivo informado."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Headline checkout:</strong> {form.checkoutHeadline || "Sem headline configurada."}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm font-semibold text-zinc-900">Checklist de prontidão</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {readinessChecklist.map((item) => (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${item.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`} key={item.label}>
                      {item.done ? "Pronto" : "Pendente"}: {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
            <button
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700"
              disabled={activeStep === 0}
              onClick={() => goToStep("prev")}
              type="button"
            >
              Voltar
            </button>
            <div className="flex flex-wrap gap-3">
              {activeStep < steps.length - 1 ? (
                <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white" onClick={() => goToStep("next")} type="button">
                  Continuar
                </button>
              ) : (
                <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white" onClick={() => save(true)} type="button">
                  Finalizar e publicar
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard subtitle="Preview persistente antes de salvar." title="Preview do produto" className="h-fit">
          <ProductVisualCard
            commission={form.commissionType === "percent" ? `${form.commissionValue}% por venda` : `R$ ${form.commissionValue.toFixed(2)} por venda`}
            price={`R$ ${form.price.toFixed(2)}`}
            status={form.visibleInShopping ? "Publico" : "Privado"}
            title={form.name || "Novo produto"}
          />
        </SectionCard>
      </div>
    </>
  );
}
