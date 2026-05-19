"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";
import { ProductRecord, useProductStore } from "@/components/mundo-mapping/product-store";

type Testimonial = { name: string; role: string; text: string };

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {helper ? <p className="mt-2 text-xs leading-5 text-zinc-500">{helper}</p> : null}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text", readOnly }: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50 read-only:bg-zinc-50 read-only:text-zinc-500"
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      type={type}
      value={value}
    />
  );
}

function Textarea({ value, onChange, rows = 4, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      value={value}
    />
  );
}

export function CheckoutEditor({ product }: { product: ProductRecord }) {
  const { updateProduct } = useProductStore();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [checkoutColor, setCheckoutColor] = useState(product.checkoutColor);
  const [checkoutBgColor, setCheckoutBgColor] = useState(product.checkoutBgColor);
  const [checkoutHeadline, setCheckoutHeadline] = useState(product.checkoutHeadline);
  const [checkoutSubheadline, setCheckoutSubheadline] = useState(product.checkoutSubheadline);
  const [checkoutCtaLabel, setCheckoutCtaLabel] = useState(product.checkoutCtaLabel || "Comprar agora");
  const [checkoutGuaranteeText, setCheckoutGuaranteeText] = useState(product.checkoutGuaranteeText);
  const [checkoutSupportText, setCheckoutSupportText] = useState(product.checkoutSupportText);
  const [checkoutThankyouMessage, setCheckoutThankyouMessage] = useState(product.checkoutThankyouMessage);
  const [supportEmail, setSupportEmail] = useState(product.supportEmail);

  const [benefits, setBenefits] = useState<string[]>(
    product.checkoutHighlights ? product.checkoutHighlights.split("\n").filter(Boolean) : []
  );

  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    Array.from({ length: 3 }, (_, i) => ({
      name: product.checkoutTestimonials[i]?.name ?? "",
      role: product.checkoutTestimonials[i]?.role ?? "",
      text: product.checkoutTestimonials[i]?.text ?? "",
    }))
  );

  const isDefault =
    checkoutColor === "#dc2626" &&
    checkoutBgColor === "#ffffff" &&
    checkoutCtaLabel === "Comprar agora" &&
    !checkoutHeadline.trim() &&
    !checkoutSubheadline.trim() &&
    benefits.filter(Boolean).length === 0 &&
    testimonials.every((t) => !t.name.trim() && !t.text.trim());

  function addBenefit() {
    setBenefits((prev) => [...prev, ""]);
  }

  function removeBenefit(index: number) {
    setBenefits((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBenefit(index: number, value: string) {
    setBenefits((prev) => prev.map((b, i) => (i === index ? value : b)));
  }

  function updateTestimonial(index: number, key: keyof Testimonial, value: string) {
    setTestimonials((prev) => prev.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
  }

  async function save() {
    setSaving(true);
    setFeedback(null);

    const checkoutHighlights = benefits.filter(Boolean).join("\n");
    const checkoutTestimonials = testimonials.filter((t) => t.name.trim() || t.text.trim());

    try {
      await updateProduct(product.slug, {
        ...product,
        checkoutColor,
        checkoutBgColor,
        checkoutHeadline,
        checkoutSubheadline,
        checkoutCtaLabel,
        checkoutGuaranteeText,
        checkoutSupportText,
        checkoutThankyouMessage,
        supportEmail,
        checkoutHighlights,
        checkoutTestimonials,
      });
      setFeedback({ msg: "Checkout salvo com sucesso.", type: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar checkout.";
      setFeedback({ msg, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const previewHighlights = benefits.filter(Boolean).length > 0
    ? benefits.filter(Boolean)
    : ["Benefício 1", "Benefício 2", "Benefício 3"];

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700"
              href={`/mundo-mapping/afiliados/produtos/${product.slug}`}
            >
              Voltar ao hub
            </Link>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] disabled:opacity-50"
              disabled={saving}
              onClick={save}
              type="button"
            >
              {saving ? "Salvando…" : "Salvar checkout"}
            </button>
          </>
        }
        description="Personalize a aparência e os textos da página de checkout do produto."
        eyebrow={`Mundo Mapping / Afiliados / Produtos / ${product.name} / Checkout`}
        title={`Checkout: ${product.name}`}
      />

      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {feedback ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {feedback.msg}
            </div>
          ) : null}

          <SectionCard subtitle="Cores e identidade visual do checkout." title="Aparência">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Cor principal">
                <div className="flex items-center gap-3">
                  <input
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 p-1"
                    onChange={(e) => setCheckoutColor(e.target.value)}
                    type="color"
                    value={checkoutColor}
                  />
                  <Input onChange={setCheckoutColor} value={checkoutColor} />
                </div>
              </Field>
              <Field label="Cor de fundo">
                <div className="flex items-center gap-3">
                  <input
                    className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 p-1"
                    onChange={(e) => setCheckoutBgColor(e.target.value)}
                    type="color"
                    value={checkoutBgColor}
                  />
                  <Input onChange={setCheckoutBgColor} value={checkoutBgColor} />
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard subtitle="Textos principais exibidos na página de checkout." title="Textos e CTA">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field helper="Título em destaque no topo do checkout." label="Headline">
                  <Input onChange={setCheckoutHeadline} placeholder="Ex: Acesse agora o Mapa 360 Pro" value={checkoutHeadline} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field helper="Texto de apoio abaixo da headline." label="Subheadline">
                  <Textarea onChange={setCheckoutSubheadline} placeholder="Ex: O método completo para..." rows={3} value={checkoutSubheadline} />
                </Field>
              </div>
              <Field helper='Texto do botão principal. Padrão: "Comprar agora".' label="Texto do botão CTA">
                <Input onChange={setCheckoutCtaLabel} placeholder="Comprar agora" value={checkoutCtaLabel} />
              </Field>
              <Field helper="Exibido abaixo do botão de compra." label="Texto de garantia">
                <Input onChange={setCheckoutGuaranteeText} placeholder="Ex: Garantia de 7 dias ou seu dinheiro de volta" value={checkoutGuaranteeText} />
              </Field>
              <div className="md:col-span-2">
                <Field helper="Instruções ou suporte exibidos próximos ao CTA." label="Texto de suporte">
                  <Textarea onChange={setCheckoutSupportText} placeholder="Ex: Dúvidas? Entre em contato com suporte@..." rows={3} value={checkoutSupportText} />
                </Field>
              </div>
              <Field helper="Email exibido para contato de suporte." label="Email de suporte">
                <Input onChange={setSupportEmail} placeholder="seu@email.com" type="email" value={supportEmail} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard subtitle="Lista de benefícios exibida no checkout." title="Benefícios">
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <input
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder={`Benefício ${index + 1}`}
                    value={benefit}
                  />
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:border-red-200 hover:text-red-600"
                    onClick={() => removeBenefit(index)}
                    title="Remover"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 text-sm font-semibold text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                onClick={addBenefit}
                type="button"
              >
                + Adicionar benefício
              </button>
            </div>
          </SectionCard>

          <SectionCard subtitle="Até 3 depoimentos exibidos no checkout." title="Depoimentos">
            <div className="space-y-5">
              {testimonials.map((t, index) => (
                <div className="rounded-2xl border border-zinc-200 p-4" key={index}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Depoimento {index + 1}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nome">
                      <Input onChange={(v) => updateTestimonial(index, "name", v)} placeholder="Ex: João Silva" value={t.name} />
                    </Field>
                    <Field label="Cargo ou cidade">
                      <Input onChange={(v) => updateTestimonial(index, "role", v)} placeholder="Ex: Empreendedor, SP" value={t.role} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Texto do depoimento">
                        <Textarea onChange={(v) => updateTestimonial(index, "text", v)} placeholder="Ex: Produto incrível, mudou minha..." rows={3} value={t.text} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard subtitle="Mensagem exibida após a confirmação da compra." title="Pós-compra">
            <Field helper="Aparece na página de obrigado após o pagamento confirmado." label="Mensagem de obrigado">
              <Textarea
                onChange={setCheckoutThankyouMessage}
                placeholder="Ex: Obrigado pela sua compra! Verifique seu e-mail para acessar o produto."
                rows={4}
                value={checkoutThankyouMessage}
              />
            </Field>
          </SectionCard>
        </div>

        {/* Live preview */}
        <div className="h-fit space-y-4">
          <SectionCard subtitle="Visualização em tempo real." title="Preview">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge label={isDefault ? "Padrão" : "Personalizado"} tone={isDefault ? "neutral" : "success"} />
            </div>
            <div className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white" style={{ backgroundColor: checkoutBgColor }}>
              <div className="p-5" style={{ backgroundColor: `${checkoutColor}18` }}>
                <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: checkoutColor }} />
                <h4 className="mt-4 text-xl font-semibold text-zinc-950">
                  {checkoutHeadline || "Headline principal do checkout"}
                </h4>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {checkoutSubheadline || "Subheadline de apoio e conversão."}
                </p>
              </div>
              <div className="p-5 space-y-4">
                <ul className="space-y-2 text-sm text-zinc-700">
                  {previewHighlights.map((item) => (
                    <li className="flex items-start gap-2" key={item}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: checkoutColor }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-xs text-zinc-500">Investimento</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-950">R$ {product.price.toFixed(2)}</p>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                    style={{ backgroundColor: checkoutColor }}
                    type="button"
                  >
                    {checkoutCtaLabel || "Comprar agora"}
                  </button>
                  {checkoutGuaranteeText && (
                    <p className="mt-3 text-xs text-zinc-500">{checkoutGuaranteeText}</p>
                  )}
                </div>
                {testimonials.some((t) => t.name.trim() || t.text.trim()) && (
                  <div className="space-y-3">
                    {testimonials.filter((t) => t.name.trim() || t.text.trim()).map((t, i) => (
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3" key={i}>
                        <p className="text-xs leading-5 text-zinc-600">&ldquo;{t.text || "…"}&rdquo;</p>
                        <p className="mt-2 text-xs font-semibold text-zinc-700">{t.name}</p>
                        {t.role && <p className="text-xs text-zinc-400">{t.role}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
