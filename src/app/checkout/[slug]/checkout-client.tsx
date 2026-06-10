"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCPF, formatPhone, validateCPF } from "@/lib/cpf";
import type { ProdutoSimples } from "./page";

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
  order_bump_ativo: boolean | null;
  order_bump_produto_id: string | null;
  order_bump_preco: number | null;
  order_bump_texto: string | null;
  order_bump_descricao: string | null;
  upsell_ativo: boolean | null;
  upsell_produto_id: string | null;
  upsell_preco: number | null;
  upsell_headline: string | null;
  upsell_timer_minutos: number | null;
};

type Step = "identificacao" | "pagamento";
type PayMethod = "cartao" | "pix";

// ─── Design tokens (dark premium) ──────────────────────────────────────────────

const RED = "#C8102E";
const RED_HOVER = "#A30D24";
const PAGE_BG = "#0a0a0a";

const CARD = "rounded-2xl border border-white/[0.06] bg-white/[0.02]";
const INPUT =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#C8102E]";
const RED_GRADIENT =
  "linear-gradient(135deg, rgba(200,16,46,0.08), rgba(200,16,46,0.02), transparent)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function parseBenefits(highlights: string | null): string[] {
  if (!highlights) return [];
  return highlights.split("\n").map((s) => s.trim()).filter(Boolean);
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#888]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text", maxLength, inputMode, autoComplete,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <input
      autoComplete={autoComplete}
      className={INPUT}
      inputMode={inputMode}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke={color} strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

// ─── Order Bump Card ──────────────────────────────────────────────────────────

function OrderBumpCard({
  produto,
  orderBumpProduto,
  selected,
  onToggle,
}: {
  produto: Produto;
  orderBumpProduto: ProdutoSimples;
  selected: boolean;
  onToggle: () => void;
}) {
  const specialPrice = produto.order_bump_preco ?? orderBumpProduto.preco;
  const texto = produto.order_bump_texto || `Sim! Quero adicionar ${orderBumpProduto.nome} por apenas R$ ${fmtMoney(specialPrice)}`;

  return (
    <div
      className="overflow-hidden rounded-2xl border transition"
      style={{
        background: RED_GRADIENT,
        borderColor: selected ? "rgba(200,16,46,0.45)" : "rgba(200,16,46,0.15)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: RED }}>
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Oferta especial — adicione ao seu pedido
      </div>

      {/* Body */}
      <button
        className="flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-white/[0.02]"
        onClick={onToggle}
        type="button"
      >
        {/* Custom checkbox */}
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition"
          style={{
            borderColor: selected ? RED : "rgba(255,255,255,0.2)",
            backgroundColor: selected ? RED : "transparent",
          }}
        >
          {selected && (
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Product image */}
        {orderBumpProduto.capa_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={orderBumpProduto.nome}
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
            src={orderBumpProduto.capa_url}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug text-white">{texto}</p>
          {produto.order_bump_descricao && (
            <p className="mt-1 text-xs leading-5 text-[#888]">{produto.order_bump_descricao}</p>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs text-[#555] line-through">
              R$ {fmtMoney(orderBumpProduto.preco)}
            </span>
            <span className="text-sm font-bold" style={{ color: RED }}>
              R$ {fmtMoney(specialPrice)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── PIX Component ────────────────────────────────────────────────────────────

const PIX_EXPIRE_SECONDS = 30 * 60;

function PixSimulation({
  valor, produto, cliente, affiliateRef, orderBumpAceito, orderBumpProdutoId, orderBumpValor,
  cupomCodigo, cupomDesconto, onSuccess,
}: {
  valor: number;
  produto: Produto;
  cliente: { nome: string; email: string; cpf: string; telefone: string };
  affiliateRef: string;
  orderBumpAceito: boolean;
  orderBumpProdutoId: string | null;
  orderBumpValor: number;
  cupomCodigo: string | null;
  cupomDesconto: number;
  onSuccess: (pedidoId: string) => void;
}) {
  type PixStep = "idle" | "loading" | "qr" | "confirming";
  const [pixStep, setPixStep] = useState<PixStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, setPedidoId] = useState<string | null>(null);
  const [, setAsaasPaymentId] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expireLeft, setExpireLeft] = useState(PIX_EXPIRE_SECONDS);

  const pedidoIdRef = useRef<string | null>(null);
  const asaasPaymentIdRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  async function gerarPix() {
    setPixStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produto.id,
          produto_nome: produto.nome,
          produto_slug: produto.slug,
          empresa_id: produto.empresa_id,
          ref: affiliateRef || undefined,
          valor,
          forma_pagamento: "pix",
          parcelas: 1,
          cliente,
          order_bump_aceito: orderBumpAceito,
          order_bump_produto_id: orderBumpAceito ? orderBumpProdutoId : null,
          order_bump_valor: orderBumpAceito ? orderBumpValor : 0,
          cupom_codigo: cupomCodigo ?? null,
          cupom_desconto: cupomDesconto,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Erro ao gerar PIX"); setPixStep("idle"); return; }
      pedidoIdRef.current = data.pedido_id;
      asaasPaymentIdRef.current = data.asaas_payment_id;
      setPedidoId(data.pedido_id);
      setAsaasPaymentId(data.asaas_payment_id);
      setQrCodeBase64(data.qr_code_base64);
      setPixCode(data.pix_code);
      setExpireLeft(PIX_EXPIRE_SECONDS);
      setPixStep("qr");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPixStep("idle");
    }
  }

  useEffect(() => {
    if (pixStep !== "qr") return;
    const expireTimer = setInterval(() => setExpireLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    const pollTimer = setInterval(async () => {
      const pid = pedidoIdRef.current;
      const apid = asaasPaymentIdRef.current;
      if (!pid || !apid) return;
      try {
        const res = await fetch(`/api/checkout/pix-status?payment_id=${encodeURIComponent(apid)}&pedido_id=${encodeURIComponent(pid)}`);
        const data = await res.json();
        if (data.pago) {
          clearInterval(pollTimer);
          clearInterval(expireTimer);
          setPixStep("confirming");
          setTimeout(() => { if (pedidoIdRef.current) onSuccessRef.current(pedidoIdRef.current); }, 1500);
        }
      } catch { /* network error, retry on next tick */ }
    }, 3000);
    return () => { clearInterval(expireTimer); clearInterval(pollTimer); };
  }, [pixStep]);

  const expireMins = String(Math.floor(expireLeft / 60)).padStart(2, "0");
  const expireSecs = String(expireLeft % 60).padStart(2, "0");

  if (pixStep === "confirming") {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "rgba(74,222,128,0.2)", backgroundColor: "rgba(74,222,128,0.06)" }}>
        <div className="mb-3 text-4xl" style={{ color: "#4ADE80" }}>✓</div>
        <p className="font-semibold" style={{ color: "#4ADE80" }}>Pagamento confirmado!</p>
        <p className="mt-1 text-sm text-[#888]">Redirecionando...</p>
      </div>
    );
  }

  if (pixStep === "idle" || pixStep === "loading") {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        <button
          className="w-full rounded-xl py-4 text-sm font-bold text-white transition disabled:opacity-60"
          disabled={pixStep === "loading"}
          onClick={gerarPix}
          style={{ backgroundColor: RED }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = RED_HOVER)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = RED)}
          type="button"
        >
          {pixStep === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Gerando QR Code...
            </span>
          ) : "Gerar QR Code PIX"}
        </button>
        <p className="text-center text-xs text-[#555]">O QR Code expira em 30 minutos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="QR Code PIX" className="h-[220px] w-[220px] rounded-2xl border border-white/[0.08] bg-white p-2" src={qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : ""} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-1.5 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Mapping Partners" className="h-8 w-8 rounded-lg object-contain" src="/logo-mapping-partners.png" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#888]">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Expira em <span className="font-mono font-semibold text-white">{expireMins}:{expireSecs}</span>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(251,191,36,0.2)", backgroundColor: "rgba(251,191,36,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#FBBF24" }} />
          <p className="text-xs font-semibold" style={{ color: "#FBBF24" }}>Aguardando confirmação do pagamento...</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[#888]">Código PIX copia e cola:</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <span className="flex-1 truncate font-mono text-xs text-[#888]">{(pixCode ?? "").slice(0, 40)}...</span>
          <button
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition"
            onClick={async () => { await navigator.clipboard.writeText(pixCode ?? ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ backgroundColor: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#4ADE80" : "#fff" }}
            type="button"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <div className={`space-y-2 p-4 ${CARD}`}>
        <p className="text-xs font-semibold text-white">Como pagar via PIX:</p>
        {["Abra o aplicativo do seu banco", "Acesse a área PIX e escolha \"Pagar com QR Code\"", "Escaneie o código ou cole o código copia e cola", "Confirme o valor e finalize o pagamento"].map((s, i) => (
          <div className="flex items-start gap-2" key={s}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-[#888]">{i + 1}</span>
            <p className="text-xs leading-5 text-[#888]">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CheckoutClient({
  produto,
  affiliateRef,
  orderBumpProduto,
}: {
  produto: Produto;
  affiliateRef: string;
  orderBumpProduto: ProdutoSimples | null;
}) {
  const router = useRouter();
  const isPhysical = produto.tipo_entregavel === "fisico";
  const benefits = parseBenefits(produto.checkout_highlights);
  const depoimentos = produto.checkout_depoimentos ?? [];
  const ctaLabel = produto.checkout_cta || "Ir para o pagamento";

  // Steps
  const [step, setStep] = useState<Step>("identificacao");
  const [method, setMethod] = useState<PayMethod>("cartao");

  // Order bump
  const hasOrderBump = Boolean(produto.order_bump_ativo && orderBumpProduto);
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const orderBumpValor = orderBumpSelected && orderBumpProduto
    ? (produto.order_bump_preco ?? orderBumpProduto.preco)
    : 0;

  // Coupon
  const [cupomInput, setCupomInput] = useState("");
  const [cupomExpanded, setCupomExpanded] = useState(false);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomErro, setCupomErro] = useState<string | null>(null);
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; percentual: number } | null>(null);

  const baseValor = produto.preco + orderBumpValor;
  const cupomDesconto = cupomAplicado
    ? Math.round((baseValor * cupomAplicado.percentual / 100) * 100) / 100
    : 0;
  const totalValor = Math.max(0, baseValor - cupomDesconto);

  // Identification
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Card (hosted redirect — no card data collected here)
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  async function lookupCep(digits: string) {
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) { setRua(data.logradouro ?? ""); setBairro(data.bairro ?? ""); setCidade(data.localidade ?? ""); setEstado(data.uf ?? ""); }
    } catch { /* ignore */ } finally { setCepLoading(false); }
  }

  function validateStep1(): string | null {
    if (!nome.trim()) return "Informe seu nome completo.";
    if (!email.trim() || !email.includes("@")) return "Informe um e-mail válido.";
    if (!validateCPF(cpf)) return "CPF inválido.";
    if (!telefone.trim()) return "Informe seu telefone com DDD.";
    if (isPhysical) {
      if (!cep.trim()) return "Informe o CEP.";
      if (!rua.trim()) return "Informe a rua.";
      if (!numero.trim()) return "Informe o número.";
      if (!cidade.trim() || !estado.trim()) return "Informe cidade e estado.";
    }
    return null;
  }

  function handleContinue() {
    const err = validateStep1();
    if (err) { setStep1Error(err); return; }
    setStep1Error(null);
    setStep("pagamento");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function aplicarCupom() {
    const codigo = cupomInput.trim().toUpperCase();
    if (!codigo) return;
    setCupomLoading(true);
    setCupomErro(null);
    setCupomAplicado(null);
    try {
      const res = await fetch("/api/checkout/validar-cupom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, produto_id: produto.id, valor_pedido: baseValor }),
      });
      const data = await res.json();
      if (data.valido) {
        setCupomAplicado({ codigo: data.codigo, percentual: data.desconto_percentual });
        setCupomExpanded(false);
      } else {
        setCupomErro(data.mensagem ?? "Cupom inválido ou expirado.");
      }
    } catch {
      setCupomErro("Erro ao validar cupom. Tente novamente.");
    } finally {
      setCupomLoading(false);
    }
  }

  function buildObrigadoUrl(pedidoId: string) {
    const params: Record<string, string> = {
      pedido_id: pedidoId,
      nome,
      email,
      cpf,
      telefone,
      valor: String(totalValor),
      forma_pagamento: method,
      produto_nome: produto.nome,
    };
    // Passa dados do upsell se ativo
    if (produto.upsell_ativo && produto.upsell_produto_id) {
      params.upsell_produto_id = produto.upsell_produto_id;
      params.upsell_preco = String(produto.upsell_preco ?? 0);
      params.upsell_headline = produto.upsell_headline ?? "";
      params.upsell_timer = String(produto.upsell_timer_minutos ?? 10);
    }
    return `/checkout/${produto.slug}/obrigado?${new URLSearchParams(params)}`;
  }

  // Cartão: cria a cobrança hospedada e redireciona para a tela segura do Asaas.
  // Nenhum dado de cartão é coletado aqui.
  async function handleCardRedirect() {
    setCardError(null);
    setCardLoading(true);
    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produto.id,
          produto_nome: produto.nome,
          produto_slug: produto.slug,
          empresa_id: produto.empresa_id,
          ref: affiliateRef || undefined,
          valor: totalValor,
          forma_pagamento: "cartao",
          parcelas: 1,
          cliente: {
            nome, email, cpf, telefone,
            endereco: isPhysical ? { cep, rua, numero, complemento, bairro, cidade, estado } : undefined,
          },
          order_bump_aceito: orderBumpSelected,
          order_bump_produto_id: orderBumpSelected ? produto.order_bump_produto_id : null,
          order_bump_valor: orderBumpValor,
          cupom_codigo: cupomAplicado?.codigo ?? null,
          cupom_desconto: cupomDesconto,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.invoiceUrl) {
        setCardError(data.error ?? "Erro ao iniciar pagamento.");
        setCardLoading(false);
        return;
      }
      window.location.href = data.invoiceUrl;
    } catch {
      setCardError("Erro de conexão. Tente novamente.");
      setCardLoading(false);
    }
  }

  const handlePixSuccess = useCallback(
    (pedidoId: string) => { router.push(buildObrigadoUrl(pedidoId)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, produto.slug, produto.nome, totalValor, nome, email, method]
  );

  const clienteData = { nome, email, cpf, telefone };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

          {/* ══ Left column ══ */}
          <div className="hidden space-y-8 lg:block">
            <div>
              {produto.capa_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={produto.nome} className="mb-5 h-14 w-auto rounded-xl object-contain" src={produto.capa_url} />
              )}
              <h1 className="text-3xl font-extrabold leading-snug text-white">
                {produto.checkout_headline ?? produto.nome}
              </h1>
              {produto.checkout_subheadline && (
                <p className="mt-4 text-base leading-7 text-[#888]">{produto.checkout_subheadline}</p>
              )}
            </div>

            {produto.checkout_garantia && (
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: RED_GRADIENT, border: "1px solid rgba(200,16,46,0.15)", color: RED }}
              >
                🛡️ {produto.checkout_garantia}
              </div>
            )}

            {benefits.length > 0 && (
              <div className={`p-6 ${CARD}`}>
                <p className="mb-4 text-sm font-semibold text-white">O que você recebe:</p>
                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li className="flex items-start gap-3 text-sm text-[#888]" key={b}>
                      <CheckIcon color={RED} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {depoimentos.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white">O que dizem nossos clientes:</p>
                {depoimentos.slice(0, 3).map((d, i) => (
                  <div className={`p-5 ${CARD}`} key={i}>
                    <p className="text-sm leading-6 text-[#888]">&ldquo;{d.text}&rdquo;</p>
                    <div className="mt-3 flex items-center gap-3">
                      {d.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={d.name} className="h-9 w-9 rounded-full object-cover" src={d.photo} />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-[#888]">{d.name[0]}</div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{d.name}</p>
                        {d.role && <p className="text-xs text-[#555]">{d.role}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex flex-wrap gap-4 px-5 py-4 ${CARD}`}>
              {["🔒 Compra segura", "🛡️ Dados criptografados", "✅ SSL certificado"].map((s) => (
                <span className="text-xs text-[#555]" key={s}>{s}</span>
              ))}
            </div>
          </div>

          {/* ══ Right column ══ */}
          <div>
            <div className="sticky top-6 space-y-3">
              {/* Order summary */}
              <div className={`p-5 ${CARD}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#555]">Pedido</p>
                    <p className="mt-1 truncate font-semibold text-white">{produto.nome}</p>
                    {produto.empresa_nome && <p className="text-xs text-[#555]">{produto.empresa_nome}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-extrabold text-white">
                      R$ {fmtMoney(totalValor)}
                    </p>
                    {orderBumpSelected && orderBumpProduto && (
                      <p className="text-xs text-[#555]">
                        Inclui order bump
                      </p>
                    )}
                  </div>
                </div>
                {/* Breakdown when order bump or coupon active */}
                {(orderBumpSelected && orderBumpProduto || !!cupomAplicado) && (
                  <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                    <div className="flex justify-between text-xs text-[#888]">
                      <span>{produto.nome}</span>
                      <span>R$ {fmtMoney(produto.preco)}</span>
                    </div>
                    {orderBumpSelected && orderBumpProduto && (
                      <div className="flex justify-between text-xs text-[#888]">
                        <span>{orderBumpProduto.nome}</span>
                        <span>R$ {fmtMoney(orderBumpValor)}</span>
                      </div>
                    )}
                    {cupomAplicado && (
                      <div className="flex justify-between text-xs font-semibold" style={{ color: "#4ADE80" }}>
                        <span>Desconto ({cupomAplicado.codigo})</span>
                        <span>- R$ {fmtMoney(cupomDesconto)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coupon input */}
              <div className={`overflow-hidden ${CARD}`}>
                {!cupomAplicado ? (
                  <>
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-sm text-[#888] transition hover:bg-white/[0.02]"
                      onClick={() => { setCupomExpanded((v) => !v); setCupomErro(null); }}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#555]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M7 7h.01M17 17h.01M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Tenho um cupom de desconto
                      </span>
                      <svg
                        className={`h-4 w-4 text-[#555] transition-transform ${cupomExpanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                      >
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {cupomExpanded && (
                      <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm uppercase tracking-widest text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[#555] focus:border-[#C8102E]"
                            maxLength={20}
                            onChange={(e) => { setCupomInput(e.target.value.toUpperCase()); setCupomErro(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") aplicarCupom(); }}
                            placeholder="SEUCODIGO"
                            value={cupomInput}
                          />
                          <button
                            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
                            disabled={!cupomInput.trim() || cupomLoading}
                            onClick={aplicarCupom}
                            style={{ backgroundColor: RED }}
                            type="button"
                          >
                            {cupomLoading
                              ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              : "Aplicar"
                            }
                          </button>
                        </div>
                        {cupomErro && (
                          <p className="text-xs text-red-400">{cupomErro}</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider" style={{ backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>
                        {cupomAplicado.codigo}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "#4ADE80" }}>
                        - R$ {fmtMoney(cupomDesconto)} de desconto
                      </span>
                    </div>
                    <button
                      className="text-xs text-[#555] transition hover:text-white"
                      onClick={() => { setCupomAplicado(null); setCupomInput(""); setCupomErro(null); }}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              {/* Order Bump Card */}
              {hasOrderBump && orderBumpProduto && (
                <OrderBumpCard
                  onToggle={() => setOrderBumpSelected((v) => !v)}
                  orderBumpProduto={orderBumpProduto}
                  produto={produto}
                  selected={orderBumpSelected}
                />
              )}

              {/* Step indicator */}
              <div className="flex items-center gap-2 px-1">
                {(["identificacao", "pagamento"] as Step[]).map((s, i) => (
                  <div className="flex items-center gap-2" key={s}>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition"
                      style={{
                        backgroundColor: step === s || (i === 0 && step === "pagamento") ? RED : "rgba(255,255,255,0.06)",
                        color: step === s || (i === 0 && step === "pagamento") ? "#fff" : "#888",
                      }}
                    >
                      {i === 0 && step === "pagamento" ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${step === s ? "text-white" : "text-[#555]"}`}>
                      {s === "identificacao" ? "Seus dados" : "Pagamento"}
                    </span>
                    {i === 0 && <div className="h-px w-6 bg-white/[0.08]" />}
                  </div>
                ))}
              </div>

              {/* ── Step 1 ── */}
              {step === "identificacao" && (
                <div className={`p-5 ${CARD}`}>
                  <p className="mb-4 text-sm font-semibold text-white">Identificação</p>
                  <div className="space-y-3">
                    <Field label="Nome completo">
                      <TextInput autoComplete="name" onChange={setNome} placeholder="João da Silva" value={nome} />
                    </Field>
                    <Field label="E-mail">
                      <TextInput autoComplete="email" onChange={setEmail} placeholder="joao@email.com" type="email" value={email} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="CPF">
                        <TextInput inputMode="numeric" maxLength={14} onChange={(v) => setCpf(formatCPF(v))} placeholder="000.000.000-00" value={cpf} />
                      </Field>
                      <Field label="Telefone (DDD)">
                        <TextInput autoComplete="tel" inputMode="tel" maxLength={15} onChange={(v) => setTelefone(formatPhone(v))} placeholder="(11) 99999-9999" value={telefone} />
                      </Field>
                    </div>

                    {isPhysical && (
                      <div className="space-y-3 border-t border-white/[0.06] pt-3">
                        <p className="text-xs font-semibold text-[#888]">Endereço de entrega</p>
                        <Field label="CEP">
                          <div className="relative">
                            <TextInput
                              inputMode="numeric"
                              maxLength={9}
                              onChange={(v) => {
                                const d = v.replace(/\D/g, "").slice(0, 8);
                                setCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
                                if (d.length === 8) lookupCep(d);
                              }}
                              placeholder="00000-000"
                              value={cep}
                            />
                            {cepLoading && <div className="absolute right-3 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />}
                          </div>
                        </Field>
                        <Field label="Rua"><TextInput onChange={setRua} placeholder="Nome da rua" value={rua} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Número"><TextInput onChange={setNumero} placeholder="123" value={numero} /></Field>
                          <Field label="Complemento"><TextInput onChange={setComplemento} placeholder="Apto 4B" value={complemento} /></Field>
                        </div>
                        <Field label="Bairro"><TextInput onChange={setBairro} placeholder="Centro" value={bairro} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Cidade"><TextInput onChange={setCidade} placeholder="São Paulo" value={cidade} /></Field>
                          <Field label="Estado"><TextInput maxLength={2} onChange={setEstado} placeholder="SP" value={estado} /></Field>
                        </div>
                      </div>
                    )}

                    {step1Error && (
                      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{step1Error}</p>
                    )}

                    <button
                      className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition"
                      onClick={handleContinue}
                      style={{ backgroundColor: RED }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = RED_HOVER)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = RED)}
                      type="button"
                    >
                      Continuar para pagamento →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2 ── */}
              {step === "pagamento" && (
                <div className={`p-5 ${CARD}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Forma de pagamento</p>
                    <button className="text-xs text-[#555] transition hover:text-white" onClick={() => setStep("identificacao")} type="button">← Voltar</button>
                  </div>

                  <div className="mb-5 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                    {(["cartao", "pix"] as PayMethod[]).map((m) => (
                      <button
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition"
                        key={m}
                        onClick={() => setMethod(m)}
                        style={
                          method === m
                            ? { backgroundColor: "rgba(255,255,255,0.06)", color: "#fff" }
                            : { color: "#888" }
                        }
                        type="button"
                      >
                        {m === "cartao" ? "💳 Cartão" : "📱 PIX"}
                      </button>
                    ))}
                  </div>

                  {method === "cartao" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-sm leading-6 text-[#888]">
                        Você conclui o pagamento na tela segura do Asaas e volta automaticamente.
                        Seus dados de cartão nunca passam pelos nossos servidores.
                      </div>

                      {cardError && (
                        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{cardError}</p>
                      )}

                      <button
                        className="w-full rounded-xl py-4 text-sm font-bold text-white transition disabled:opacity-60"
                        disabled={cardLoading}
                        onClick={handleCardRedirect}
                        style={{ backgroundColor: RED }}
                        onMouseEnter={(e) => { if (!cardLoading) e.currentTarget.style.backgroundColor = RED_HOVER; }}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = RED)}
                        type="button"
                      >
                        {cardLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner />
                            Redirecionando para o pagamento...
                          </span>
                        ) : ctaLabel}
                      </button>

                      <p className="flex items-center justify-center gap-1.5 text-xs text-[#555]">
                        <LockIcon />
                        Pagamento processado com segurança pela Asaas
                      </p>
                    </div>
                  )}

                  {method === "pix" && (
                    <PixSimulation
                      affiliateRef={affiliateRef}
                      cliente={clienteData}
                      cupomCodigo={cupomAplicado?.codigo ?? null}
                      cupomDesconto={cupomDesconto}
                      onSuccess={handlePixSuccess}
                      orderBumpAceito={orderBumpSelected}
                      orderBumpProdutoId={produto.order_bump_produto_id}
                      orderBumpValor={orderBumpValor}
                      produto={produto}
                      valor={totalValor}
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
