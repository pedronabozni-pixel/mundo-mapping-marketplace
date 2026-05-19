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

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
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

function isUrl(v: string) {
  return /^https?:\/\//.test(v.trim());
}

export function CheckoutEditor({ product }: { product: ProductRecord }) {
  const { updateProduct } = useProductStore();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [checkoutColor, setCheckoutColor] = useState(product.checkoutColor || "#dc2626");
  const [checkoutBgColor, setCheckoutBgColor] = useState(product.checkoutBgColor || "#ffffff");
  const [checkoutHeadline, setCheckoutHeadline] = useState(isUrl(product.checkoutHeadline) ? "" : product.checkoutHeadline);
  const [checkoutSubheadline, setCheckoutSubheadline] = useState(isUrl(product.checkoutSubheadline) ? "" : product.checkoutSubheadline);
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

  const previewBenefits = benefits.filter(Boolean);

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

      <div className="grid gap-6 p-6 xl:grid-cols-[3fr_2fr]">
        {/* ── Forms ── */}
        <div className="space-y-6">
          {feedback ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {feedback.msg}
            </div>
          ) : null}

          <SectionCard subtitle="Cores aplicadas em botões, destaques e fundo da página." title="Aparência">
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

          <SectionCard subtitle="Textos exibidos na página de compra." title="Textos e CTA">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field helper="Título em destaque no topo do checkout. Deixe vazio para usar o nome do produto." label="Headline">
                  <Input onChange={setCheckoutHeadline} placeholder="Ex: Acesse agora o Mapa 360 Pro" value={checkoutHeadline} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field helper="Texto de apoio abaixo da headline." label="Subheadline">
                  <Textarea onChange={setCheckoutSubheadline} placeholder="Ex: O método completo para mapear e escalar qualquer negócio…" rows={3} value={checkoutSubheadline} />
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
                  <Textarea onChange={setCheckoutSupportText} placeholder="Ex: Dúvidas? Entre em contato com suporte@…" rows={3} value={checkoutSupportText} />
                </Field>
              </div>
              <Field helper="Email de contato exibido no checkout." label="Email de suporte">
                <Input onChange={setSupportEmail} placeholder="seu@email.com" type="email" value={supportEmail} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard subtitle="Itens exibidos na lista de benefícios do checkout." title="Benefícios">
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:border-red-200 hover:text-red-600"
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

          <SectionCard subtitle="Até 3 depoimentos de clientes exibidos no checkout." title="Depoimentos">
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
                        <Textarea onChange={(v) => updateTestimonial(index, "text", v)} placeholder="Ex: Produto incrível, mudou minha…" rows={3} value={t.text} />
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

        {/* ── Live Preview ── */}
        <div className="xl:sticky xl:top-6 h-fit">
          <SectionCard
            action={<StatusBadge label={isDefault ? "Padrão" : "Personalizado"} tone={isDefault ? "neutral" : "success"} />}
            subtitle="Simulação fiel do checkout em tempo real."
            title="Preview"
          >
            <div
              className="overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)]"
              style={{ backgroundColor: checkoutBgColor }}
            >
              {/* ── Checkout header ── */}
              <div className="px-6 py-5" style={{ backgroundColor: `${checkoutColor}14` }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: checkoutColor }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: checkoutColor }}>
                    Checkout seguro
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug text-zinc-950">
                  {checkoutHeadline || product.name}
                </h3>
                {checkoutSubheadline ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{checkoutSubheadline}</p>
                ) : (
                  product.description && (
                    <p className="mt-2 text-sm leading-6 text-zinc-500 line-clamp-2">{product.description}</p>
                  )
                )}
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* ── Benefits ── */}
                {previewBenefits.length > 0 && (
                  <ul className="space-y-2.5">
                    {previewBenefits.map((item) => (
                      <li className="flex items-start gap-2.5 text-sm text-zinc-700" key={item}>
                        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: checkoutColor }} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* ── Order box ── */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Investimento</p>
                      <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-950">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${checkoutColor}40`, color: checkoutColor }}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Compra segura
                    </div>
                  </div>

                  <button
                    className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-[0_6px_20px_-8px_rgba(0,0,0,0.3)] transition"
                    style={{ backgroundColor: checkoutColor }}
                    type="button"
                  >
                    {checkoutCtaLabel || "Comprar agora"}
                  </button>

                  {checkoutGuaranteeText ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-zinc-500">{checkoutGuaranteeText}</span>
                    </div>
                  ) : null}

                  {(checkoutSupportText || supportEmail) && (
                    <p className="mt-3 text-center text-xs text-zinc-400">
                      {checkoutSupportText || `Suporte: ${supportEmail}`}
                    </p>
                  )}
                </div>

                {/* ── Testimonials ── */}
                {testimonials.some((t) => t.name.trim() || t.text.trim()) && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">O que dizem nossos clientes</p>
                    {testimonials.filter((t) => t.name.trim() || t.text.trim()).map((t, i) => (
                      <div className="rounded-xl border border-zinc-100 bg-white p-4" key={i}>
                        <p className="text-sm leading-6 text-zinc-600">&ldquo;{t.text || "…"}&rdquo;</p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: checkoutColor }}>
                            {t.name.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-800">{t.name || "Cliente"}</p>
                            {t.role && <p className="text-xs text-zinc-400">{t.role}</p>}
                          </div>
                        </div>
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
