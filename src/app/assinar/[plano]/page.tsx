"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

// ─── Plan metadata ─────────────────────────────────────────────────────────────

const PLAN_INFO: Record<string, { label: string; price: string; period: string; features: string[] }> = {
  partner: {
    label: "Partner",
    price: "R$117",
    period: "/mês",
    features: [
      "Até 10 produtos no marketplace",
      "Dashboard de performance completo",
      "Curadoria automática por nicho",
      "Vê identidade dos creators afiliados",
      "Suporte via chat",
    ],
  },
  elite: {
    label: "Elite",
    price: "R$197",
    period: "/mês",
    features: [
      "Tudo do Partner",
      "Produtos ilimitados",
      "Curadoria humana de creators",
      "Materiais de venda personalizados",
      "Account manager dedicado",
      "Relatórios avançados de GMV",
    ],
  },
};

// ─── Formatters ────────────────────────────────────────────────────────────────

function formatCpfCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  return v.replace(/\D/g, "").slice(0, 6).replace(/(\d{2})(\d{1,4})/, "$1/$2");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-zinc-700">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  readOnly?: boolean;
}) {
  return (
    <input
      autoComplete={autoComplete}
      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
        readOnly
          ? "border-zinc-100 bg-zinc-50 text-zinc-400 cursor-default"
          : "border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
      }`}
      inputMode={inputMode}
      onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      type={type}
      value={value}
    />
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

// ─── PIX QR display ───────────────────────────────────────────────────────────

function PixPending({
  pixQrCode,
  pixPayload,
  onCopy,
  copied,
}: {
  pixQrCode: string | null;
  pixPayload: string | null;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-base font-semibold text-zinc-900">Aguardando pagamento PIX</p>
        <p className="text-sm text-zinc-500">Escaneie o QR code ou copie o código abaixo</p>
      </div>

      {pixQrCode ? (
        <img
          alt="QR Code PIX"
          className="h-52 w-52 rounded-2xl border border-zinc-100 shadow-sm"
          src={`data:image/png;base64,${pixQrCode}`}
        />
      ) : (
        <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50">
          <p className="text-xs text-zinc-400">QR code indisponível</p>
        </div>
      )}

      {pixPayload && (
        <div className="w-full space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Copia e cola</p>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 outline-none"
              readOnly
              value={pixPayload}
            />
            <button
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                copied
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={onCopy}
              type="button"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" d="M4 12a8 8 0 018-8" fill="currentColor" />
        </svg>
        Aguardando confirmação do pagamento…
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AssinarPage() {
  const params = useParams();
  const router = useRouter();
  const plano = (params?.plano as string ?? "").toLowerCase();
  const planInfo = PLAN_INFO[plano];

  const [step, setStep] = useState<"dados" | "pagamento" | "pix" | "sucesso">("dados");
  const [billingType, setBillingType] = useState<"CREDIT_CARD" | "PIX">("CREDIT_CARD");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dados
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [senha, setSenha] = useState("");

  // Card
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // PIX state
  const [pixData, setPixData] = useState<{
    subscriptionId: string;
    paymentId: string | null;
    pixPayload: string | null;
    pixQrCode: string | null;
  } | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!planInfo) {
      router.replace("/mundo-mapping/partners");
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        setEmail(user.email ?? "");
        // Pre-fill name/cpfCnpj from profile
        supabase.from("profiles").select("full_name, company_name, cpf_cnpj").eq("id", user.id).single()
          .then(({ data }) => {
            if (data) {
              setNome(data.company_name ?? data.full_name ?? "");
              setCpfCnpj(data.cpf_cnpj ?? "");
            }
          });
      }
      setLoadingUser(false);
    });
  }, [planInfo, router]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPixPolling(paymentId: string, isNewAccount: boolean) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/checkout/subscription/pix-status?paymentId=${encodeURIComponent(paymentId)}&plano=${encodeURIComponent(plano)}`
        );
        const data = await res.json();
        if (data.approved) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (isNewAccount) {
            const supabase = createClient();
            await supabase.auth.signInWithPassword({ email, password: senha });
          }
          setStep("sucesso");
        }
      } catch {
        // ignore transient errors
      }
    }, 3000);
  }

  async function handleDadosNext() {
    setError(null);
    if (!nome.trim()) { setError("Informe seu nome."); return; }
    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    if (!cpfCnpj.replace(/\D/g, "").length) { setError("Informe CPF ou CNPJ."); return; }
    if (!isLoggedIn && senha.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return; }
    setStep("pagamento");
  }

  async function handlePayment() {
    // Guard: should never be reachable outside the pagamento step
    if (step !== "pagamento") return;
    setError(null);
    setSubmitting(true);

    const expiryParts = cardExpiry.replace(/\D/g, "");
    const expiryMonth = expiryParts.slice(0, 2);
    const expiryYear = expiryParts.slice(2, 6);

    const payload = {
      plano,
      nome,
      email,
      cpfCnpj,
      ...(!isLoggedIn ? { senha } : {}),
      billingType,
      ...(billingType === "CREDIT_CARD" && {
        card: {
          holderName: cardHolder,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth,
          expiryYear,
          ccv: cardCvv,
        },
      }),
    };

    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao processar pagamento.");
        return;
      }

      if (data.pendingPix) {
        setPixData({
          subscriptionId: data.subscriptionId,
          paymentId: data.paymentId,
          pixPayload: data.pixPayload,
          pixQrCode: data.pixQrCode,
        });
        setAccountCreated(data.newAccount);
        setStep("pix");
        if (data.paymentId) startPixPolling(data.paymentId, data.newAccount);
      } else {
        // Card success
        if (data.newAccount) {
          setAccountCreated(true);
          const supabase = createClient();
          await supabase.auth.signInWithPassword({ email, password: senha });
        }
        setStep("sucesso");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyPix() {
    if (!pixData?.pixPayload) return;
    navigator.clipboard.writeText(pixData.pixPayload).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!planInfo || loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <MappingPartnersLogo size="sm" />
          <a
            className="text-sm text-zinc-500 hover:text-zinc-800"
            href="/mundo-mapping/empresa/login"
          >
            Já tem conta? Entrar
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: form */}
          <div>
            {step === "sucesso" ? (
              <div className="flex flex-col items-center gap-6 rounded-[24px] border border-zinc-200 bg-white px-5 py-8 text-center shadow-sm sm:px-8 sm:py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-950">Assinatura confirmada!</h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Plano <span className="font-semibold">{planInfo.label}</span> ativo com sucesso.
                    {accountCreated
                      ? " Sua conta foi criada automaticamente e você já está logado."
                      : ""}
                  </p>
                </div>
                <button
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                  onClick={() => router.push("/mundo-mapping/afiliados")}
                  type="button"
                >
                  Acessar painel
                </button>
              </div>
            ) : step === "pix" && pixData ? (
              <div className="rounded-[24px] border border-zinc-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
                <h2 className="mb-6 text-lg font-semibold text-zinc-950">Pagamento via PIX</h2>
                <PixPending
                  copied={copied}
                  onCopy={handleCopyPix}
                  pixPayload={pixData.pixPayload}
                  pixQrCode={pixData.pixQrCode}
                />
                <p className="mt-4 text-center text-xs text-zinc-400">
                  O plano será ativado automaticamente após o pagamento ser confirmado.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] border border-zinc-200 bg-white shadow-sm">
                {/* Step header */}
                <div className="border-b border-zinc-100 px-5 py-5 sm:px-8 sm:py-6">
                  <div className="flex items-center gap-3">
                    <StepDot active={step === "dados"} done={step === "pagamento"} label="1" />
                    <div className="h-px flex-1 bg-zinc-200" />
                    <StepDot active={step === "pagamento"} done={false} label="2" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {step === "dados" ? "Passo 1 de 2" : "Passo 2 de 2"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                    {step === "dados" ? "Seus dados" : "Forma de pagamento"}
                  </h2>
                </div>

                <div className="px-5 py-5 sm:px-8 sm:py-7">
                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Step 1: Dados */}
                  {step === "dados" && (
                    <div className="space-y-5">
                      <FieldRow>
                        <Label>Nome completo / Razão social</Label>
                        <Input
                          autoComplete="name"
                          onChange={setNome}
                          placeholder="Sua empresa ou seu nome"
                          value={nome}
                        />
                      </FieldRow>
                      <FieldRow>
                        <Label>E-mail</Label>
                        <Input
                          autoComplete="email"
                          onChange={setEmail}
                          placeholder="contato@empresa.com.br"
                          readOnly={isLoggedIn}
                          type="email"
                          value={email}
                        />
                        {isLoggedIn && <p className="text-xs text-zinc-400">E-mail da conta logada.</p>}
                      </FieldRow>
                      <FieldRow>
                        <Label>CPF / CNPJ</Label>
                        <Input
                          inputMode="numeric"
                          onChange={(v) => setCpfCnpj(formatCpfCnpj(v))}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          value={cpfCnpj}
                        />
                      </FieldRow>
                      {!isLoggedIn && (
                        <FieldRow>
                          <Label>Senha para sua conta</Label>
                          <Input
                            autoComplete="new-password"
                            onChange={setSenha}
                            placeholder="Mínimo 8 caracteres"
                            type="password"
                            value={senha}
                          />
                          <p className="text-xs text-zinc-400">Uma conta será criada automaticamente com este e-mail e senha.</p>
                        </FieldRow>
                      )}
                      <button
                        className="mt-2 h-11 w-full rounded-xl bg-red-600 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                        onClick={handleDadosNext}
                        type="button"
                      >
                        Continuar para pagamento
                      </button>
                    </div>
                  )}

                  {/* Step 2: Pagamento */}
                  {step === "pagamento" && (
                    <div className="space-y-6">
                      {/* Billing type tabs */}
                      <div className="flex rounded-xl border border-zinc-200 p-1">
                        {(["CREDIT_CARD", "PIX"] as const).map((bt) => (
                          <button
                            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                              billingType === bt
                                ? "bg-zinc-950 text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-800"
                            }`}
                            key={bt}
                            onClick={() => setBillingType(bt)}
                            type="button"
                          >
                            {bt === "CREDIT_CARD" ? "Cartão de crédito" : "PIX"}
                          </button>
                        ))}
                      </div>

                      {billingType === "CREDIT_CARD" && (
                        <div className="space-y-4">
                          <FieldRow>
                            <Label>Nome no cartão</Label>
                            <Input
                              autoComplete="cc-name"
                              onChange={setCardHolder}
                              placeholder="Como aparece no cartão"
                              value={cardHolder}
                            />
                          </FieldRow>
                          <FieldRow>
                            <Label>Número do cartão</Label>
                            <Input
                              autoComplete="cc-number"
                              inputMode="numeric"
                              onChange={(v) => setCardNumber(formatCardNumber(v))}
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                            />
                          </FieldRow>
                          <div className="grid grid-cols-2 gap-4">
                            <FieldRow>
                              <Label>Validade</Label>
                              <Input
                                autoComplete="cc-exp"
                                inputMode="numeric"
                                onChange={(v) => setCardExpiry(formatExpiry(v))}
                                placeholder="MM/AAAA"
                                value={cardExpiry}
                              />
                            </FieldRow>
                            <FieldRow>
                              <Label>CVV</Label>
                              <Input
                                autoComplete="cc-csc"
                                inputMode="numeric"
                                onChange={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                                placeholder="123"
                                value={cardCvv}
                              />
                            </FieldRow>
                          </div>
                        </div>
                      )}

                      {billingType === "PIX" && (
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-4">
                          <p className="text-sm font-semibold text-zinc-800">Pagamento via PIX</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Um QR code será gerado após confirmação. O plano ativa assim que o pagamento for identificado.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                          onClick={() => { setError(null); setStep("dados"); }}
                          type="button"
                        >
                          Voltar
                        </button>
                        <button
                          className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700 disabled:opacity-60"
                          disabled={submitting}
                          onClick={handlePayment}
                          type="button"
                        >
                          {submitting
                            ? "Processando…"
                            : billingType === "PIX"
                            ? "Gerar QR Code PIX"
                            : `Assinar por ${planInfo.price}/mês`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: plan summary */}
          <div className="h-fit rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Resumo</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {planInfo.price}
              <span className="text-sm font-normal text-zinc-400">{planInfo.period}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-700">Plano {planInfo.label}</p>
            <div className="mt-4 space-y-2.5 border-t border-zinc-100 pt-4">
              {planInfo.features.map((feat) => (
                <div className="flex items-start gap-2" key={feat}>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-sm text-zinc-600">{feat}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
              Cobrança mensal recorrente. Cancele quando quiser pelo painel.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
        done
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-zinc-950 text-white"
          : "border border-zinc-200 bg-white text-zinc-400"
      }`}
    >
      {done ? (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        label
      )}
    </div>
  );
}
