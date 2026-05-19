"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { UpgradeModal } from "@/components/mundo-mapping/empresa-plan-banner";

type Plan = "associate" | "partner" | "elite";

const PLAN_LABEL: Record<Plan, string> = {
  associate: "Associate",
  partner: "Partner",
  elite: "Elite",
};

const PLAN_LIMITS: Record<Plan, number | null> = {
  associate: 1,
  partner: 10,
  elite: null,
};

const PLAN_DESC: Record<Plan, string> = {
  associate: "Grátis · Taxa por venda: Asaas + 2%",
  partner: "R$117/mês · Taxa por venda: Asaas + R$0,99",
  elite: "R$197/mês · Taxa por venda: Asaas + R$0,49",
};

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

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-zinc-950 outline-none transition ${
          readOnly
            ? "border-zinc-100 bg-zinc-50 text-zinc-400 cursor-default"
            : "border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        }`}
        name={name}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
      />
      {readOnly && <p className="mt-1 text-xs text-zinc-400">Não é possível alterar o e-mail.</p>}
    </div>
  );
}

export default function EmpresaPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("associate");
  const [planStart, setPlanStart] = useState<string | null>(null);
  const [planValidoAte, setPlanValidoAte] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string>("ativo");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    cpf_cnpj: "",
    phone: "",
    website: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/mundo-mapping/empresa/login"; return; }
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setPlan((profile.plano as Plan) ?? "associate");
        setPlanStart(profile.created_at ?? null);
        setPlanValidoAte(profile.plano_valido_ate ?? null);
        setPlanStatus(profile.plano_status ?? "ativo");
        setHasSubscription(!!profile.asaas_subscription_id);
        setLogoUrl(profile.logo_url ?? "");
        setForm({
          company_name: profile.company_name ?? "",
          cpf_cnpj: profile.cpf_cnpj ?? "",
          phone: profile.phone ?? "",
          website: profile.website ?? "",
        });
      }

      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setProductCount(count ?? 0);

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setInfo(null);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...form, logo_url: logoUrl }, { onConflict: "id" });
      if (err) setError(err.message);
      else setInfo("Perfil salvo com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });
      if (upErr) { setError(upErr.message); return; }
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao cancelar assinatura.");
      } else {
        setPlan("associate");
        setHasSubscription(false);
        setPlanValidoAte(null);
        setPlanStatus("ativo");
        setInfo("Assinatura cancelada. Seu plano foi revertido para Associate.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

  const limit = PLAN_LIMITS[plan];
  const planStartFormatted = planStart
    ? new Date(planStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Perfil da empresa ou produtor"
        description="Gerencie as informações da sua conta e seu plano."
      />

      <div className="space-y-6 p-6">
        {info && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {info}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Dados básicos */}
        <SectionCard title="Dados básicos" subtitle="Informações da sua conta no marketplace.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome / Razão social"
              name="company_name"
              onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
              placeholder="Empresa Ltda. ou seu nome"
              value={form.company_name}
            />
            <Field
              label="CPF/CNPJ"
              name="cpf_cnpj"
              onChange={(v) => setForm((f) => ({ ...f, cpf_cnpj: formatCpfCnpj(v) }))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={form.cpf_cnpj}
            />
            <Field label="E-mail" name="email" readOnly value={email} />
            <Field
              label="Telefone"
              name="phone"
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="(11) 99999-9999"
              value={form.phone}
            />
            <Field
              label="Site"
              name="website"
              onChange={(v) => setForm((f) => ({ ...f, website: v }))}
              placeholder="https://suaempresa.com.br"
              value={form.website}
            />

            {/* Logo upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Logo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    alt="Logo"
                    className="h-14 w-14 rounded-2xl border border-zinc-200 object-cover"
                    src={logoUrl}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                    Logo
                  </div>
                )}
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                  disabled={uploadingLogo}
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  {uploadingLogo ? "Enviando…" : "Alterar logo"}
                </button>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  ref={fileRef}
                  type="file"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700 disabled:opacity-60"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </SectionCard>

        {/* Plano atual */}
        <SectionCard title="Plano atual" subtitle="Detalhes do seu plano e limites.">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                  Plano {PLAN_LABEL[plan]}
                </span>
                {planStatus === "inadimplente" && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                    Inadimplente
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500">{PLAN_DESC[plan]}</p>
              <p className="text-sm text-zinc-500">
                Ativo desde: <span className="font-medium text-zinc-700">{planStartFormatted}</span>
              </p>
              {planValidoAte && (
                <p className="text-sm text-zinc-500">
                  Próxima cobrança:{" "}
                  <span className="font-medium text-zinc-700">
                    {new Date(planValidoAte).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </p>
              )}
              <p className="text-sm text-zinc-500">
                Produtos:{" "}
                <span className="font-medium text-zinc-700">
                  {limit === null
                    ? `${productCount} (ilimitados)`
                    : `${productCount} de ${limit} utilizados`}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan !== "elite" && (
                <button
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                  onClick={() => setModalOpen(true)}
                  type="button"
                >
                  Fazer upgrade
                </button>
              )}
              {hasSubscription && (
                <button
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  onClick={() => setConfirmCancel(true)}
                  type="button"
                >
                  Cancelar assinatura
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Cancel subscription confirm dialog */}
        {confirmCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4">
            <div className="w-full max-w-md rounded-[20px] border border-zinc-200 bg-white p-7 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.4)]">
              <h3 className="text-base font-semibold text-zinc-950">Cancelar assinatura</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Tem certeza que deseja cancelar sua assinatura? Seu plano será revertido para{" "}
                <strong>Associate (grátis)</strong> imediatamente.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  disabled={cancelling}
                  onClick={() => setConfirmCancel(false)}
                  type="button"
                >
                  Manter assinatura
                </button>
                <button
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                  disabled={cancelling}
                  onClick={handleCancelSubscription}
                  type="button"
                >
                  {cancelling ? "Cancelando…" : "Sim, cancelar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de pagamentos */}
        <SectionCard title="Histórico de pagamentos" subtitle="Suas cobranças e faturas.">
          <div className="overflow-hidden rounded-[20px] border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left">
              <thead className="bg-zinc-50">
                <tr>
                  {["Data", "Descrição", "Valor", "Status"].map((col) => (
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                      key={col}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-zinc-400" colSpan={4}>
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {modalOpen && <UpgradeModal currentPlan={plan} onClose={() => setModalOpen(false)} />}
    </>
  );
}
