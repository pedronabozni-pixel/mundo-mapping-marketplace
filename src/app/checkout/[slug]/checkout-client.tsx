"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCPF, formatPhone, validateCPF } from "@/lib/cpf";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Produto = {
  id: string;
  slug: string;
  nome: string;
  empresa_id: string;
  empresa_nome: string | null;
  preco: number;
  tipo_entregavel: string | null;
  checkout_headline: string | null;
  checkout_subheadline: string | null;
  checkout_cta: string | null;
  checkout_garantia: string | null;
  checkout_cor: string | null;
  checkout_cor_fundo: string | null;
  checkout_highlights: string | null;
  checkout_depoimentos: Array<{ name: string; role?: string; text: string; photo?: string }> | null;
  checkout_mensagem_obrigado: string | null;
  capa_url: string | null;
  comissao_tipo: string;
  comissao_valor: number;
};

type Step = "identificacao" | "pagamento";
type PayMethod = "cartao" | "pix";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function detectBrand(num: string) {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]\d{2}/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  return "";
}

function installmentOptions(price: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const val = Math.ceil((price / n) * 100) / 100;
    const fmtVal = val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const fmtTotal = price.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    return {
      n,
      label: n === 1
        ? `1× de R$ ${fmtTotal} (à vista)`
        : `${n}× de R$ ${fmtVal} sem juros`,
    };
  });
}

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function parseBenefits(highlights: string | null): string[] {
  if (!highlights) return [];
  return highlights.split("\n").map((s) => s.trim()).filter(Boolean);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", maxLength, inputMode,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; maxLength?: number; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
      inputMode={inputMode}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <select
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke={color} strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── PIX Component ────────────────────────────────────────────────────────────

function PixPayment({
  valor, produto, cliente, affiliateRef, onSuccess,
}: {
  valor: number;
  produto: Produto;
  cliente: { nome: string; email: string; cpf: string; telefone: string };
  affiliateRef: string;
  onSuccess: (pedidoId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ qrCode: string; payload: string; paymentId: string } | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function gerarPix() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produto.id,
          produto_nome: produto.nome,
          empresa_id: produto.empresa_id,
          ref: affiliateRef || undefined,
          valor,
          forma_pagamento: "pix",
          parcelas: 1,
          cliente,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Erro ao gerar PIX"); return; }
      setPix({ qrCode: data.pix.qrCode, payload: data.pix.payload, paymentId: data.pix.paymentId });
      setPedidoId(data.pedido_id);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Start polling when PIX is generated
  useEffect(() => {
    if (!pix) return;
    timerRef.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/pix-status?payment_id=${pix.paymentId}`);
        const data = await res.json();
        if (data.paid) {
          setPaid(true);
          clearInterval(pollRef.current!);
          clearInterval(timerRef.current!);
          if (pedidoId) onSuccess(pedidoId);
        }
      } catch { /* ignore poll errors */ }
    }, 5000);
    return () => {
      clearInterval(pollRef.current!);
      clearInterval(timerRef.current!);
    };
  }, [pix, pedidoId, onSuccess]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  if (paid) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mb-2 text-2xl">✓</div>
        <p className="font-semibold text-emerald-800">Pagamento confirmado!</p>
        <p className="mt-1 text-sm text-emerald-700">Redirecionando...</p>
      </div>
    );
  }

  if (!pix) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <button
          className="w-full rounded-xl bg-zinc-800 py-4 text-sm font-bold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          disabled={loading}
          onClick={gerarPix}
          type="button"
        >
          {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
        </button>
        <p className="text-center text-xs text-zinc-400">O QR Code expira em 30 minutos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center">
        {/* QR Code */}
        {pix.qrCode && (
          <img
            alt="QR Code PIX"
            className="mx-auto mb-3 h-48 w-48 rounded-xl"
            src={`data:image/png;base64,${pix.qrCode}`}
          />
        )}
        <p className="mb-1 text-xs font-semibold text-zinc-500">Expira em</p>
        <p className="font-mono text-xl font-bold text-zinc-800">{mins}:{secs}</p>
      </div>

      {/* Copy code */}
      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Ou copie o código PIX:</p>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3">
          <span className="flex-1 truncate font-mono text-xs text-zinc-600">{pix.payload}</span>
          <button
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${copied ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
            onClick={async () => {
              await navigator.clipboard.writeText(pix.payload);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            type="button"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold text-zinc-700">Como pagar:</p>
        {[
          "Abra o app do seu banco",
          "Acesse a área PIX",
          "Escolha 'Pagar com QR Code' ou 'Copiar e colar'",
          "Cole o código ou escaneie o QR Code",
          "Confirme o pagamento",
        ].map((step, i) => (
          <div className="flex items-start gap-2" key={step}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
              {i + 1}
            </span>
            <p className="text-xs text-zinc-600">{step}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-400">
        Aguardando confirmação do pagamento...
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutClient({
  produto,
  affiliateRef,
}: {
  produto: Produto;
  affiliateRef: string;
}) {
  const router = useRouter();
  const primaryColor = produto.checkout_cor ?? "#dc2626";
  const benefits = parseBenefits(produto.checkout_highlights);
  const depoimentos = produto.checkout_depoimentos ?? [];
  const ctaLabel = produto.checkout_cta ?? "Comprar agora";
  const isPhysical = produto.tipo_entregavel === "fisico";

  // Step state
  const [step, setStep] = useState<Step>("identificacao");
  const [method, setMethod] = useState<PayMethod>("cartao");
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Step 1 — Identification
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  // Physical address
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // Step 2 — Card
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [cardError, setCardError] = useState<string | null>(null);

  const installmentList = installmentOptions(produto.preco);
  const brand = detectBrand(cardNum);

  // CEP lookup
  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch { /* ignore */ } finally {
      setCepLoading(false);
    }
  }

  function validateStep1(): string | null {
    if (!nome.trim()) return "Informe seu nome completo.";
    if (!email.trim() || !email.includes("@")) return "Informe um e-mail válido.";
    if (!validateCPF(cpf)) return "CPF inválido.";
    if (!telefone.trim()) return "Informe seu telefone.";
    if (isPhysical) {
      if (!cep.trim()) return "Informe o CEP.";
      if (!rua.trim()) return "Informe a rua.";
      if (!numero.trim()) return "Informe o número.";
      if (!cidade.trim()) return "Informe a cidade.";
      if (!estado.trim()) return "Informe o estado.";
    }
    return null;
  }

  function handleStep1() {
    const err = validateStep1();
    if (err) { setFormError(err); return; }
    setFormError(null);
    setStep("pagamento");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCardPay() {
    if (!cardNum.replace(/\D/g, "") || cardNum.replace(/\D/g, "").length < 13) {
      setCardError("Número de cartão inválido."); return;
    }
    if (!cardName.trim()) { setCardError("Informe o nome impresso no cartão."); return; }
    if (!cardExpiry.includes("/")) { setCardError("Validade inválida."); return; }
    if (!cardCvv || cardCvv.length < 3) { setCardError("CVV inválido."); return; }

    setCardError(null);
    setActionLoading(true);

    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produto.id,
          produto_nome: produto.nome,
          empresa_id: produto.empresa_id,
          ref: affiliateRef || undefined,
          valor: produto.preco,
          forma_pagamento: "cartao",
          parcelas: installments,
          cliente: {
            nome, email, cpf, telefone,
            endereco: isPhysical ? { cep, rua, numero, complemento, bairro, cidade, estado } : undefined,
          },
          cartao: {
            numero: cardNum.replace(/\s/g, ""),
            nome: cardName,
            validade: cardExpiry,
            cvv: cardCvv,
          },
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setCardError(data.error ?? "Pagamento recusado. Verifique os dados do cartão.");
        return;
      }

      // Success — redirect to obrigado
      const params = new URLSearchParams({
        pedido_id: data.pedido_id,
        nome,
        email,
        valor: String(produto.preco),
        forma_pagamento: "cartao",
        produto_nome: produto.nome,
      });
      router.push(`/checkout/${produto.slug}/obrigado?${params.toString()}`);
    } catch {
      setCardError("Erro de conexão. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  }

  const handlePixSuccess = useCallback((pedidoId: string) => {
    const params = new URLSearchParams({
      pedido_id: pedidoId,
      nome,
      email,
      valor: String(produto.preco),
      forma_pagamento: "pix",
      produto_nome: produto.nome,
    });
    router.push(`/checkout/${produto.slug}/obrigado?${params.toString()}`);
  }, [router, produto.slug, produto.nome, produto.preco, nome, email]);

  const clienteData = { nome, email, cpf, telefone };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: produto.checkout_cor_fundo ?? "#f9fafb" }}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_440px]">

          {/* ── Left column — Product info ── */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Logo + Product name */}
            <div>
              {produto.capa_url && (
                <img
                  alt={produto.nome}
                  className="mb-4 h-16 w-auto rounded-xl object-contain"
                  src={produto.capa_url}
                />
              )}
              <h1 className="text-2xl font-bold text-zinc-900 lg:text-3xl">
                {produto.checkout_headline ?? produto.nome}
              </h1>
              {produto.checkout_subheadline && (
                <p className="mt-3 text-base leading-7 text-zinc-600">{produto.checkout_subheadline}</p>
              )}
            </div>

            {/* Guarantee badge */}
            {produto.checkout_garantia && (
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <ShieldIcon />
                {produto.checkout_garantia}
              </div>
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="mb-4 text-sm font-semibold text-zinc-900">O que você recebe:</p>
                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li className="flex items-start gap-3 text-sm text-zinc-700" key={b}>
                      <CheckIcon color={primaryColor} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Testimonials */}
            {depoimentos.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-zinc-900">O que dizem nossos clientes:</p>
                {depoimentos.slice(0, 3).map((d, i) => (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5" key={i}>
                    <p className="text-sm leading-6 text-zinc-700">"{d.text}"</p>
                    <div className="mt-3 flex items-center gap-3">
                      {d.photo ? (
                        <img alt={d.name} className="h-9 w-9 rounded-full object-cover" src={d.photo} />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                          {d.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{d.name}</p>
                        {d.role && <p className="text-xs text-zinc-500">{d.role}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Security seals */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-4">
              {[
                { icon: "🔒", label: "Compra segura" },
                { icon: "🛡️", label: "Dados criptografados" },
                { icon: "✅", label: "Pagamento protegido" },
                { icon: "🔐", label: "SSL certificado" },
              ].map((s) => (
                <div className="flex items-center gap-2 text-xs text-zinc-500" key={s.label}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — Checkout form ── */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-6 space-y-4">
              {/* Order summary */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Seu pedido</p>
                    <p className="mt-1 font-semibold text-zinc-900">{produto.nome}</p>
                    <p className="text-xs text-zinc-500">{produto.empresa_nome ?? ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900">
                      R$ {fmtMoney(produto.preco)}
                    </p>
                    {installments > 1 && step === "pagamento" && method === "cartao" && (
                      <p className="text-xs text-zinc-500">
                        {installments}× de R$ {fmtMoney(Math.ceil((produto.preco / installments) * 100) / 100)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 px-1">
                {(["identificacao", "pagamento"] as Step[]).map((s, i) => (
                  <div className="flex items-center gap-2" key={s}>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: step === s || (i === 0 && step === "pagamento") ? primaryColor : "#e4e4e7",
                        color: step === s || (i === 0 && step === "pagamento") ? "#fff" : "#71717a",
                      }}
                    >
                      {i === 0 && step === "pagamento" ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${step === s ? "text-zinc-900" : "text-zinc-400"}`}>
                      {s === "identificacao" ? "Identificação" : "Pagamento"}
                    </span>
                    {i === 0 && <div className="h-px w-8 bg-zinc-200" />}
                  </div>
                ))}
              </div>

              {/* ── Step 1: Identification ── */}
              {step === "identificacao" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <p className="mb-4 text-sm font-semibold text-zinc-900">Seus dados</p>
                  <div className="space-y-3">
                    <Field label="Nome completo">
                      <Input onChange={setNome} placeholder="João da Silva" value={nome} />
                    </Field>
                    <Field label="E-mail">
                      <Input onChange={setEmail} placeholder="joao@email.com" type="email" value={email} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="CPF">
                        <Input
                          inputMode="numeric"
                          maxLength={14}
                          onChange={(v) => setCpf(formatCPF(v))}
                          placeholder="000.000.000-00"
                          value={cpf}
                        />
                      </Field>
                      <Field label="Telefone">
                        <Input
                          inputMode="tel"
                          maxLength={15}
                          onChange={(v) => setTelefone(formatPhone(v))}
                          placeholder="(11) 99999-9999"
                          value={telefone}
                        />
                      </Field>
                    </div>

                    {isPhysical && (
                      <>
                        <div className="border-t border-zinc-100 pt-3">
                          <p className="mb-3 text-xs font-semibold text-zinc-500">Endereço de entrega</p>
                        </div>
                        <Field label="CEP">
                          <div className="relative">
                            <Input
                              inputMode="numeric"
                              maxLength={9}
                              onChange={(v) => {
                                const digits = v.replace(/\D/g, "").slice(0, 8);
                                const fmt = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
                                setCep(fmt);
                                if (digits.length === 8) lookupCep(digits);
                              }}
                              placeholder="00000-000"
                              value={cep}
                            />
                            {cepLoading && (
                              <div className="absolute right-3 top-3.5">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                              </div>
                            )}
                          </div>
                        </Field>
                        <Field label="Rua">
                          <Input onChange={setRua} placeholder="Nome da rua" value={rua} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Número">
                            <Input onChange={setNumero} placeholder="123" value={numero} />
                          </Field>
                          <Field label="Complemento">
                            <Input onChange={setComplemento} placeholder="Apto 4B" value={complemento} />
                          </Field>
                        </div>
                        <Field label="Bairro">
                          <Input onChange={setBairro} placeholder="Centro" value={bairro} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Cidade">
                            <Input onChange={setCidade} placeholder="São Paulo" value={cidade} />
                          </Field>
                          <Field label="Estado">
                            <Input maxLength={2} onChange={setEstado} placeholder="SP" value={estado} />
                          </Field>
                        </div>
                      </>
                    )}

                    {formError && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </p>
                    )}

                    <button
                      className="w-full rounded-xl py-4 text-sm font-bold text-white transition hover:opacity-90"
                      onClick={handleStep1}
                      style={{ backgroundColor: primaryColor }}
                      type="button"
                    >
                      Continuar para pagamento →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Payment ── */}
              {step === "pagamento" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">Pagamento</p>
                    <button
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                      onClick={() => setStep("identificacao")}
                      type="button"
                    >
                      ← Voltar
                    </button>
                  </div>

                  {/* Payment method tabs */}
                  <div className="mb-5 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                    {(["cartao", "pix"] as PayMethod[]).map((m) => (
                      <button
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${method === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        key={m}
                        onClick={() => setMethod(m)}
                        type="button"
                      >
                        {m === "cartao" ? "💳 Cartão" : "📱 PIX"}
                      </button>
                    ))}
                  </div>

                  {/* Card form */}
                  {method === "cartao" && (
                    <div className="space-y-3">
                      <Field label={`Número do cartão${brand ? ` — ${brand}` : ""}`}>
                        <Input
                          inputMode="numeric"
                          maxLength={19}
                          onChange={(v) => setCardNum(formatCardNumber(v))}
                          placeholder="0000 0000 0000 0000"
                          value={cardNum}
                        />
                      </Field>
                      <Field label="Nome no cartão">
                        <Input
                          onChange={(v) => setCardName(v.toUpperCase())}
                          placeholder="NOME COMO NO CARTÃO"
                          value={cardName}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Validade">
                          <Input
                            inputMode="numeric"
                            maxLength={5}
                            onChange={(v) => setCardExpiry(formatExpiry(v))}
                            placeholder="MM/AA"
                            value={cardExpiry}
                          />
                        </Field>
                        <Field label="CVV">
                          <Input
                            inputMode="numeric"
                            maxLength={4}
                            onChange={setCardCvv}
                            placeholder="123"
                            type="password"
                            value={cardCvv}
                          />
                        </Field>
                      </div>
                      <Field label="Parcelas">
                        <Select
                          onChange={(v) => setInstallments(Number(v))}
                          options={installmentList.map((o) => ({ value: o.n, label: o.label }))}
                          value={installments}
                        />
                      </Field>

                      {cardError && (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {cardError}
                        </p>
                      )}

                      <button
                        className="w-full rounded-xl py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        disabled={actionLoading}
                        onClick={handleCardPay}
                        style={{ backgroundColor: primaryColor }}
                        type="button"
                      >
                        {actionLoading ? "Processando..." : ctaLabel}
                      </button>

                      <p className="text-center text-xs text-zinc-400">
                        🔒 Compra 100% segura e criptografada
                      </p>
                    </div>
                  )}

                  {/* PIX form */}
                  {method === "pix" && (
                    <PixPayment
                      affiliateRef={affiliateRef}
                      cliente={clienteData}
                      onSuccess={handlePixSuccess}
                      produto={produto}
                      valor={produto.preco}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
