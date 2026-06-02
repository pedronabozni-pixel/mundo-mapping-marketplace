"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MetricCard,
  MiniStat,
  PageHeader,
  ProductVisualCard,
  SectionCard,
  StatusBadge
} from "@/components/mundo-mapping/affiliate-ui";
import { getEmptyProduct, ProductInput, ProductRecord, PRODUCT_TYPE_OPTIONS, useProductStore } from "@/components/mundo-mapping/product-store";
import { usePlanLimits } from "@/components/mundo-mapping/use-plan-limits";
import { UpgradeModal } from "@/components/mundo-mapping/empresa-plan-banner";

const steps = [
  "Informações principais",
  "Precificação e comissão",
  "Segmentação de afiliados",
  "Materiais de divulgação",
  "Link e distribuição",
  "Regras operacionais",
  "Revisão e publicação"
];

function InfoPopover({ content }: { content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-400 text-[10px] font-bold text-white transition hover:bg-zinc-500"
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        type="button"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-5 top-0 z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
          {content}
        </div>
      )}
    </div>
  );
}

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
  min,
  max
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      max={max}
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
  rows = 5,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
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
  const { createProduct, updateProduct, products } = useProductStore();
  const { plan, planLabel, limit, productCount, atLimit, loaded } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(initialProduct ?? getEmptyProduct());

  useEffect(() => {
    async function captureEmpresaId() {
      if (form.empresaId) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) patch("empresaId", user.id);
    }
    captureEmpresaId();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      { label: "Regras de atribuição definidas", done: Boolean(form.attributionModel) && form.attributionWindowDays > 0 },
      { label: "Critérios de creator definidos", done: form.minimumFollowers >= 2000 },
      { label: "Materiais ou capa informados", done: Boolean(form.materialsSummary.trim() || form.coverAssetUrl || form.coverAssetName) },
      { label: "URL do produto informada", done: Boolean(form.checkoutUrl.trim()) }
    ],
    [form]
  );

  function validateUrl(url: string): string | null {
    if (!url.trim()) return "O link do produto é obrigatório.";
    if (!/^https?:\/\/.+/.test(url.trim())) return "A URL deve começar com http:// ou https://";
    return null;
  }

  function patch<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "checkoutUrl") setUrlError(validateUrl(value as string));
  }

  function goToStep(direction: "next" | "prev") {
    setActiveStep((current) => {
      if (direction === "next") return Math.min(current + 1, steps.length - 1);
      return Math.max(current - 1, 0);
    });
  }

  async function save(publish = false) {
    if (mode === "create" && atLimit) {
      setFeedback({ msg: `Limite do plano ${planLabel} atingido. Faça upgrade para cadastrar mais produtos.`, type: "error" });
      return;
    }

    if (publish) {
      try {
        const guardRes = await fetch("/api/mundo-mapping/empresa/produtos/publicar", { method: "POST" });
        if (!guardRes.ok) {
          const body = await guardRes.json().catch(() => ({}));
          setFeedback({ msg: (body as { error?: string }).error ?? "Não foi possível publicar o produto.", type: "error" });
          return;
        }
      } catch {
        setFeedback({ msg: "Erro ao verificar permissão de publicação. Tente novamente.", type: "error" });
        return;
      }
    }

    const guaranteeDays = Math.min(30, Math.max(7, form.guaranteeDays || 0));
    const normalized: ProductInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      audience: form.audience.trim(),
      materialsSummary: form.materialsSummary.trim(),
      guaranteeDays,
      releaseDays: guaranteeDays,
      status: publish ? "published" : "draft"
    };

    if (!normalized.name) {
      setFeedback({ msg: "Preencha o nome do produto para continuar.", type: "error" });
      setActiveStep(0);
      return;
    }

    // URL obrigatória apenas ao publicar — rascunhos podem ser salvos sem ela
    if (publish) {
      const urlValidation = validateUrl(normalized.checkoutUrl);
      if (urlValidation) {
        setFeedback({ msg: urlValidation, type: "error" });
        setUrlError(urlValidation);
        setActiveStep(4);
        return;
      }
    }

    if (normalized.guaranteeDays < 7) {
      setFeedback({ msg: "A janela de garantia deve ser de no mínimo 7 dias.", type: "error" });
      setActiveStep(1);
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const result =
        mode === "create"
          ? await createProduct(normalized, publish)
          : await updateProduct(initialProduct!.slug, normalized, publish);

      setSaving(false);
      setFeedback({ msg: publish ? "Produto publicado com sucesso." : "Rascunho salvo com sucesso.", type: "success" });
      router.push(`/mundo-mapping/afiliados/produtos/${result.slug}`);
    } catch (err) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao salvar produto.";
      setFeedback({ msg, type: "error" });
    }
  }

  if (mode === "create" && loaded && atLimit) {
    return (
      <>
        <PageHeader
          description="Gerencie e publique produtos para os influenciadores afiliados promoverem."
          eyebrow="Mundo Mapping / Afiliados / Novo produto"
          title="Novo produto"
        />
        <div className="p-6">
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-8 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.2)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-950">Limite de produtos atingido</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Você está no plano <span className="font-semibold">{planLabel}</span> e já possui{" "}
                  <span className="font-semibold">{productCount} produto{productCount !== 1 ? "s" : ""}</span> cadastrado{productCount !== 1 ? "s" : ""}.
                  {limit !== null && ` O limite do seu plano é de ${limit} produto${limit !== 1 ? "s" : ""}.`}
                  {" "}Faça upgrade para cadastrar mais produtos.
                </p>
                <button
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                  onClick={() => setUpgradeOpen(true)}
                  type="button"
                >
                  Fazer upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
        {upgradeOpen && <UpgradeModal currentPlan={plan} onClose={() => setUpgradeOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 disabled:opacity-50"
              disabled={saving}
              onClick={() => save(false)}
              type="button"
            >
              {saving ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] disabled:opacity-50"
              disabled={saving}
              onClick={() => save(true)}
              type="button"
            >
              {saving ? "Salvando…" : mode === "create" ? "Publicar produto" : "Atualizar produto"}
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
          {feedback ? (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {feedback.msg}
            </div>
          ) : null}

          {activeStep === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field helper="Nome que aparece no hub, no shopping e nos relatórios." label="Nome do produto">
                <Input onChange={(value) => patch("name", value)} placeholder="Ex.: Mapa 360 Pro" value={form.name} />
              </Field>
              <Field helper="Selecione um dos tipos aceitos pela plataforma." label="Tipo de produto">
                <Select
                  onChange={(value) => patch("category", value)}
                  options={PRODUCT_TYPE_OPTIONS.map((option) => ({ label: option, value: option }))}
                  value={form.category}
                />
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
              <Field helper="Mínimo 7 dias, máximo 30 dias." label="Janela de garantia (dias)">
                <Input max={30} min={7} onChange={(value) => patch("guaranteeDays", Math.min(30, Math.max(7, Number(value) || 0)))} type="number" value={form.guaranteeDays} />
              </Field>
              <Field label="Liberação da comissão">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
                  A comissão é liberada após o período de garantia ({form.guaranteeDays} dias)
                </div>
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
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-700">Modo financeiro</span>
                  <InfoPopover
                    content={
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Como funciona o modo financeiro?</p>
                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-zinc-700">Ledger da plataforma</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">O pagamento da venda entra primeiro na plataforma. Após o período de garantia, a comissão é liberada para o creator. Mais seguro e rastreável.</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-700">Split na plataforma</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">O pagamento é dividido automaticamente no momento da venda entre a empresa e o creator via gateway. Mais rápido, mas exige configuração avançada no Asaas.</p>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
                <Select
                  onChange={(value) => patch("payoutMode", value as ProductInput["payoutMode"])}
                  options={[
                    { label: "Ledger da plataforma", value: "platform_ledger" },
                    { label: "Split na plataforma", value: "platform_split" }
                  ]}
                  value={form.payoutMode}
                />
              </div>
              <div className="md:col-span-2 grid gap-4">
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
              <Field helper="Mínimo 2.000 seguidores — critério base da plataforma." label="Seguidores mínimos">
                <Input min={2000} onChange={(value) => patch("minimumFollowers", Math.max(2000, Number(value) || 2000))} type="number" value={form.minimumFollowers} />
              </Field>
              <Field helper="Separar por país, estado, cidade ou regra comercial." label="Regiões elegíveis">
                <Input onChange={(value) => patch("allowedRegions", value)} value={form.allowedRegions} />
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
                <div className="md:col-span-2">
                  <Field label="URL do produto (destino do link de afiliado)">
                    <Input onChange={(value) => patch("checkoutUrl", value)} placeholder="https://pay.hotmart.com/..." value={form.checkoutUrl} />
                    {urlError ? (
                      <p className="mt-1.5 text-sm font-medium text-red-600">{urlError}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-zinc-500">URL externa onde o produto é comprado (ex: Hotmart, Kiwify). O link de afiliado redireciona para ela.</p>
                    )}
                  </Field>
                </div>
                <Field label="Tipo de entregável">
                  <Select
                    onChange={(value) => patch("tipoEntregavel", value as "digital" | "fisico" | "evento" | "servico")}
                    options={[
                      { label: "Digital (ebook, curso, acesso)", value: "digital" },
                      { label: "Físico (produto com entrega)", value: "fisico" },
                      { label: "Evento (presencial ou online)", value: "evento" },
                      { label: "Serviço (consultoria, mentoria)", value: "servico" },
                    ]}
                    value={form.tipoEntregavel}
                  />
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
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                A personalização visual do checkout (cores, headline, CTA, benefícios, depoimentos) é feita no <strong className="text-zinc-700">Hub do produto → Editar checkout</strong>.
              </div>

              {/* ── Order Bump ── */}
              <div className="rounded-[24px] border border-zinc-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Order Bump</p>
                    <p className="mt-1 text-xs text-zinc-500">Oferta extra exibida no checkout, antes do pagamento.</p>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${form.orderBumpAtivo ? "bg-red-600" : "bg-zinc-200"}`}
                    onClick={() => patch("orderBumpAtivo", !form.orderBumpAtivo)}
                    type="button"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.orderBumpAtivo ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {form.orderBumpAtivo && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Field helper="Produto que será oferecido como order bump." label="Produto do order bump">
                        <Select
                          onChange={(v) => patch("orderBumpProdutoId", v)}
                          options={[
                            { label: "Selecione um produto…", value: "" },
                            ...products
                              .filter((p) => p.id !== (initialProduct?.id ?? ""))
                              .map((p) => ({ label: p.name, value: p.id })),
                          ]}
                          value={form.orderBumpProdutoId}
                        />
                      </Field>
                    </div>
                    <Field helper="Preço especial exibido no card do order bump." label="Preço especial (R$)">
                      <Input min={0} onChange={(v) => patch("orderBumpPreco", Number(v) || 0)} type="number" value={form.orderBumpPreco} />
                    </Field>
                    <Field helper='Ex: "Sim! Quero adicionar por apenas R$X"' label="Texto principal do card">
                      <Input onChange={(v) => patch("orderBumpTexto", v)} placeholder="Aproveite esta oferta exclusiva!" value={form.orderBumpTexto} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Descrição curta">
                        <Textarea onChange={(v) => patch("orderBumpDescricao", v)} placeholder="1-2 linhas descrevendo o benefício adicional." rows={2} value={form.orderBumpDescricao} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Upsell ── */}
              <div className="rounded-[24px] border border-zinc-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Upsell (pós-compra)</p>
                    <p className="mt-1 text-xs text-zinc-500">Oferta com 1 clique exibida na página de obrigado.</p>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${form.upsellAtivo ? "bg-red-600" : "bg-zinc-200"}`}
                    onClick={() => patch("upsellAtivo", !form.upsellAtivo)}
                    type="button"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.upsellAtivo ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {form.upsellAtivo && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Field helper="Produto que será oferecido como upsell." label="Produto do upsell">
                        <Select
                          onChange={(v) => patch("upsellProdutoId", v)}
                          options={[
                            { label: "Selecione um produto…", value: "" },
                            ...products
                              .filter((p) => p.id !== (initialProduct?.id ?? ""))
                              .map((p) => ({ label: p.name, value: p.id })),
                          ]}
                          value={form.upsellProdutoId}
                        />
                      </Field>
                    </div>
                    <Field helper="Preço especial para quem acabou de comprar." label="Preço especial (R$)">
                      <Input min={0} onChange={(v) => patch("upsellPreco", Number(v) || 0)} type="number" value={form.upsellPreco} />
                    </Field>
                    <Field helper="Padrão: 10 minutos." label="Timer de urgência (minutos)">
                      <Input min={1} onChange={(v) => patch("upsellTimerMinutos", Number(v) || 10)} type="number" value={form.upsellTimerMinutos} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Headline do upsell">
                        <Input onChange={(v) => patch("upsellHeadline", v)} placeholder="Oferta exclusiva para quem acabou de comprar!" value={form.upsellHeadline} />
                      </Field>
                    </div>
                  </div>
                )}
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
                <p className="mt-3"><strong className="text-zinc-900">Seguidores mínimos:</strong> {form.minimumFollowers.toLocaleString("pt-BR")}</p>
                <p className="mt-3"><strong className="text-zinc-900">Modelo de atribuição:</strong> {form.attributionModel}</p>
                <p className="mt-3"><strong className="text-zinc-900">Janela de atribuição:</strong> {form.attributionWindowDays} dias</p>
                <p className="mt-3"><strong className="text-zinc-900">Base da comissão:</strong> {form.commissionBase}</p>
                <p className="mt-3"><strong className="text-zinc-900">Liberação da comissão:</strong> após garantia ({form.guaranteeDays} dias)</p>
                <p className="mt-3"><strong className="text-zinc-900">Materiais:</strong> {form.materialsSummary || "Sem materiais informados."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Capa:</strong> {form.coverAssetMode === "link" ? form.coverAssetUrl || "Sem link informado." : form.coverAssetName || "Sem arquivo informado."}</p>
                <p className="mt-3"><strong className="text-zinc-900">Materiais promocionais:</strong> {form.promoAssetMode === "link" ? form.promoAssetUrl || "Sem link informado." : form.promoAssetName || "Sem arquivo informado."}</p>
                <p className="mt-3"><strong className="text-zinc-900">URL do produto:</strong> {form.checkoutUrl || "Não informada."}</p>
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
                <>
                  <button className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50" disabled={saving} onClick={() => save(false)} type="button">
                    {saving ? "Salvando…" : "Salvar rascunho"}
                  </button>
                  <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} onClick={() => save(true)} type="button">
                    {saving ? "Salvando…" : "Finalizar e publicar"}
                  </button>
                </>
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
      {upgradeOpen && <UpgradeModal currentPlan={plan} onClose={() => setUpgradeOpen(false)} />}
    </>
  );
}
