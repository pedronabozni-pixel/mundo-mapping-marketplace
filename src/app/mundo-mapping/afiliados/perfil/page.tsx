"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

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

function formatCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

const SEGMENTOS = [
  "Agronegócio", "Alimentação", "Beleza e Estética", "Construção Civil",
  "Educação", "Entretenimento", "Esporte e Fitness", "Financeiro",
  "Imobiliário", "Moda e Vestuário", "Saúde e Bem-estar", "Tecnologia",
  "Turismo e Viagem", "Varejo", "Outros",
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function Field({
  label, name, value, onChange, onBlur, type = "text", placeholder, readOnly = false, hint,
}: {
  label: string; name: string; value: string; onChange?: (v: string) => void;
  onBlur?: () => void; type?: string; placeholder?: string; readOnly?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>{label}</label>
      <input
        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555]"
        name={name}
        onBlur={onBlur}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#C8102E"; }}
        placeholder={placeholder}
        readOnly={readOnly}
        style={
          readOnly
            ? { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#555", cursor: "default" }
            : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
        }
        type={type}
        value={value}
        onBlurCapture={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; onBlur?.(); }}
      />
      {hint && <p className="mt-1 text-xs" style={{ color: "#555" }}>{hint}</p>}
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>{label}</label>
      <select
        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
        value={value}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function DocUpload({
  label, url, uploading, onUpload,
}: {
  label: string; url: string; uploading: boolean; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {url ? (
          <a
            className="mt-0.5 block truncate text-xs text-[#C8102E] underline underline-offset-2"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            Documento enviado — visualizar
          </a>
        ) : (
          <p className="mt-0.5 text-xs" style={{ color: "#555" }}>Nenhum documento enviado.</p>
        )}
      </div>
      <button
        className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        type="button"
      >
        {uploading ? "Enviando…" : url ? "Substituir" : "Enviar"}
      </button>
      <input accept="image/*,.pdf" className="hidden" onChange={onUpload} ref={ref} type="file" />
    </div>
  );
}

type FormState = {
  cpf_cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  segmento: string;
  receber_propostas: string;
  telefone: string;
  celular: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  estado: string;
  cidade: string;
  bairro: string;
  nome_responsavel: string;
  cargo_responsavel: string;
  rg_responsavel: string;
  cpf_responsavel: string;
  data_nascimento: string;
  email_responsavel: string;
};

const EMPTY_FORM: FormState = {
  cpf_cnpj: "", nome_fantasia: "", razao_social: "", segmento: "", receber_propostas: "",
  telefone: "", celular: "",
  cep: "", endereco: "", numero: "", complemento: "", estado: "", cidade: "", bairro: "",
  nome_responsavel: "", cargo_responsavel: "", rg_responsavel: "", cpf_responsavel: "",
  data_nascimento: "", email_responsavel: "",
};

export default function EmpresaPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<"cartao" | "comprovante" | "docid" | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [cartaoCnpjUrl, setCartaoCnpjUrl] = useState("");
  const [comprovanteUrl, setComprovanteUrl] = useState("");
  const [docIdUrl, setDocIdUrl] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const logoRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
        setLogoUrl(profile.logo_url ?? "");
        setCartaoCnpjUrl(profile.cartao_cnpj_url ?? "");
        setComprovanteUrl(profile.comprovante_endereco_url ?? "");
        setDocIdUrl(profile.doc_identificacao_url ?? "");
        const next: FormState = {
          cpf_cnpj: profile.cpf_cnpj ?? "",
          nome_fantasia: profile.company_name ?? "",
          razao_social: profile.razao_social ?? "",
          segmento: profile.segmento ?? "",
          receber_propostas: profile.receber_propostas ?? "",
          telefone: profile.phone ?? "",
          celular: profile.celular ?? "",
          cep: profile.cep ?? "",
          endereco: profile.endereco ?? "",
          numero: profile.numero ?? "",
          complemento: profile.complemento ?? "",
          estado: profile.estado ?? "",
          cidade: profile.cidade ?? "",
          bairro: profile.bairro ?? "",
          nome_responsavel: profile.nome_responsavel ?? "",
          cargo_responsavel: profile.cargo_responsavel ?? "",
          rg_responsavel: profile.rg_responsavel ?? "",
          cpf_responsavel: profile.cpf_responsavel ?? "",
          data_nascimento: profile.data_nascimento ?? "",
          email_responsavel: profile.email_responsavel ?? "",
        };
        setForm(next);
        setInitialForm(next);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleCepBlur() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const viaCep = await res.json();
      if (!viaCep.erro) {
        setForm((f) => ({
          ...f,
          endereco: viaCep.logradouro || f.endereco,
          bairro: viaCep.bairro || f.bairro,
          cidade: viaCep.localidade || f.cidade,
          estado: viaCep.uf || f.estado,
        }));
      }
    } catch {}
  }

  async function handleSave() {
    setSaving(true);
    setInfo(null);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("profiles").upsert(
        {
          id: userId,
          logo_url: logoUrl,
          cartao_cnpj_url: cartaoCnpjUrl,
          comprovante_endereco_url: comprovanteUrl,
          doc_identificacao_url: docIdUrl,
          cpf_cnpj: form.cpf_cnpj,
          company_name: form.nome_fantasia,
          razao_social: form.razao_social,
          segmento: form.segmento,
          receber_propostas: form.receber_propostas,
          phone: form.telefone,
          celular: form.celular,
          cep: form.cep,
          endereco: form.endereco,
          numero: form.numero,
          complemento: form.complemento,
          estado: form.estado,
          cidade: form.cidade,
          bairro: form.bairro,
          nome_responsavel: form.nome_responsavel,
          cargo_responsavel: form.cargo_responsavel,
          rg_responsavel: form.rg_responsavel,
          cpf_responsavel: form.cpf_responsavel,
          data_nascimento: form.data_nascimento || null,
          email_responsavel: form.email_responsavel,
        },
        { onConflict: "id" }
      );
      if (err) setError(err.message);
      else {
        setInitialForm(form);
        setInfo("Perfil salvo com sucesso.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setForm(initialForm);
    setInfo(null);
    setError(null);
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

  async function handleDocUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    docType: "cartao" | "comprovante" | "docid"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(docType);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const slug = docType === "cartao" ? "cartao-cnpj" : docType === "comprovante" ? "comprovante-endereco" : "doc-identificacao";
      const path = `${userId}/${slug}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });
      if (upErr) { setError(upErr.message); return; }
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      if (docType === "cartao") setCartaoCnpjUrl(data.publicUrl);
      else if (docType === "comprovante") setComprovanteUrl(data.publicUrl);
      else setDocIdUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleChangePassword() {
    setError(null);
    setInfo(null);
    if (!novaSenha) { setError("Digite a nova senha."); return; }
    if (novaSenha.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { setError("As senhas não coincidem."); return; }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password: novaSenha });
      if (err) setError(err.message);
      else {
        setNovaSenha("");
        setConfirmarSenha("");
        setInfo("Senha alterada com sucesso.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-[#C8102E]" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#C8102E" }} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Perfil da empresa ou produtor"
        description="Gerencie as informações da sua conta."
      />

      <div className="space-y-6 p-6">
        {info && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ADE80" }}>
            {info}
          </div>
        )}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}>
            {error}
          </div>
        )}

        {/* 1. Dados da empresa */}
        <SectionCard title="Dados da empresa" subtitle="Informações principais da sua empresa ou negócio.">
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Logo</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  alt="Logo"
                  className="h-16 w-16 rounded-2xl object-cover"
                  src={logoUrl}
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-xs" style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#555" }}>
                  Logo
                </div>
              )}
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                disabled={uploadingLogo}
                onClick={() => logoRef.current?.click()}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                type="button"
              >
                {uploadingLogo ? "Enviando…" : "Alterar logo"}
              </button>
              <input accept="image/*" className="hidden" onChange={handleLogoUpload} ref={logoRef} type="file" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="CNPJ/CPF"
              name="cpf_cnpj"
              onChange={(v) => setField("cpf_cnpj", formatCpfCnpj(v))}
              placeholder="00.000.000/0000-00 ou 000.000.000-00"
              value={form.cpf_cnpj}
            />
            <Field
              label="Nome Fantasia"
              name="nome_fantasia"
              onChange={(v) => setField("nome_fantasia", v)}
              placeholder="Nome comercial"
              value={form.nome_fantasia}
            />
            <Field
              label="Razão Social"
              name="razao_social"
              onChange={(v) => setField("razao_social", v)}
              placeholder="Razão social completa"
              value={form.razao_social}
            />
            <SelectField
              label="Segmento"
              onChange={(v) => setField("segmento", v)}
              options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
              placeholder="Selecione o segmento…"
              value={form.segmento}
            />
            <SelectField
              label="Receber Propostas"
              onChange={(v) => setField("receber_propostas", v)}
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
              placeholder="Selecione…"
              value={form.receber_propostas}
            />
          </div>
        </SectionCard>

        {/* 2. Informações de contato */}
        <SectionCard title="Informações de contato" subtitle="Dados para contato da empresa.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Telefone"
              name="telefone"
              onChange={(v) => setField("telefone", v)}
              placeholder="(11) 3333-3333"
              value={form.telefone}
            />
            <Field
              label="Celular"
              name="celular"
              onChange={(v) => setField("celular", v)}
              placeholder="(11) 99999-9999"
              value={form.celular}
            />
            <Field label="Email" name="email" readOnly value={email} />
          </div>
        </SectionCard>

        {/* 3. Endereço */}
        <SectionCard title="Endereço" subtitle="Endereço da empresa ou sede. Preencha o CEP para preenchimento automático.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="CEP"
              name="cep"
              onBlur={handleCepBlur}
              onChange={(v) => setField("cep", formatCep(v))}
              placeholder="00000-000"
              value={form.cep}
            />
            <Field
              label="Endereço"
              name="endereco"
              onChange={(v) => setField("endereco", v)}
              placeholder="Rua, Avenida…"
              value={form.endereco}
            />
            <Field
              label="Número"
              name="numero"
              onChange={(v) => setField("numero", v)}
              placeholder="123"
              value={form.numero}
            />
            <Field
              label="Complemento"
              name="complemento"
              onChange={(v) => setField("complemento", v)}
              placeholder="Sala, Andar, Apto…"
              value={form.complemento}
            />
            <SelectField
              label="Estado"
              onChange={(v) => setField("estado", v)}
              options={ESTADOS_BR.map((uf) => ({ value: uf, label: uf }))}
              placeholder="Selecione o estado…"
              value={form.estado}
            />
            <Field
              label="Cidade"
              name="cidade"
              onChange={(v) => setField("cidade", v)}
              placeholder="São Paulo"
              value={form.cidade}
            />
            <Field
              label="Bairro"
              name="bairro"
              onChange={(v) => setField("bairro", v)}
              placeholder="Centro"
              value={form.bairro}
            />
          </div>
        </SectionCard>

        {/* 4. Dados do responsável */}
        <SectionCard title="Dados do Responsável" subtitle="Informações do responsável legal pela empresa.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome do Responsável"
              name="nome_responsavel"
              onChange={(v) => setField("nome_responsavel", v)}
              placeholder="Nome completo"
              value={form.nome_responsavel}
            />
            <Field
              label="Cargo do Responsável"
              name="cargo_responsavel"
              onChange={(v) => setField("cargo_responsavel", v)}
              placeholder="Diretor, Sócio, Proprietário…"
              value={form.cargo_responsavel}
            />
            <Field
              label="RG do Responsável"
              name="rg_responsavel"
              onChange={(v) => setField("rg_responsavel", v)}
              placeholder="00.000.000-0"
              value={form.rg_responsavel}
            />
            <Field
              label="CPF do Responsável"
              name="cpf_responsavel"
              onChange={(v) => setField("cpf_responsavel", v)}
              placeholder="000.000.000-00"
              value={form.cpf_responsavel}
            />
            <Field
              label="Data de nascimento"
              name="data_nascimento"
              onChange={(v) => setField("data_nascimento", v)}
              type="date"
              value={form.data_nascimento}
            />
            <Field
              label="E-mail do Responsável"
              name="email_responsavel"
              onChange={(v) => setField("email_responsavel", v)}
              placeholder="responsavel@empresa.com.br"
              type="email"
              value={form.email_responsavel}
            />
          </div>
        </SectionCard>

        {/* 5. Documentos */}
        <SectionCard title="Documentos" subtitle="Envie os documentos necessários para verificação da conta.">
          <div className="space-y-3">
            <DocUpload
              label="Enviar Cartão (CNPJ ou CPF)"
              uploading={uploadingDoc === "cartao"}
              url={cartaoCnpjUrl}
              onUpload={(e) => handleDocUpload(e, "cartao")}
            />
            <DocUpload
              label="Enviar Comprovante de Endereço"
              uploading={uploadingDoc === "comprovante"}
              url={comprovanteUrl}
              onUpload={(e) => handleDocUpload(e, "comprovante")}
            />
            <DocUpload
              label="Enviar Documento de Identificação (RG ou CPF)"
              uploading={uploadingDoc === "docid"}
              url={docIdUrl}
              onUpload={(e) => handleDocUpload(e, "docid")}
            />
          </div>
        </SectionCard>

        {/* 6. Alterar senha */}
        <SectionCard title="Alterar Senha" subtitle="Defina uma nova senha para sua conta.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Nova Senha"
              name="nova_senha"
              onChange={setNovaSenha}
              placeholder="••••••••"
              type="password"
              value={novaSenha}
            />
            <Field
              label="Confirmar Senha"
              name="confirmar_senha"
              onChange={setConfirmarSenha}
              placeholder="••••••••"
              type="password"
              value={confirmarSenha}
            />
          </div>
          <div className="mt-5">
            <button
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              disabled={changingPassword}
              onClick={handleChangePassword}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              type="button"
            >
              {changingPassword ? "Alterando…" : "Alterar senha"}
            </button>
          </div>
        </SectionCard>

        {/* Histórico de pagamentos */}
        <SectionCard title="Histórico de pagamentos" subtitle="Suas cobranças e faturas.">
          <div className="overflow-hidden rounded-[20px]" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="min-w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                <tr>
                  {["Data", "Descrição", "Valor", "Status"].map((col) => (
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
                      key={col}
                      style={{ color: "#555", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-8 text-center text-sm" colSpan={4} style={{ color: "#555" }}>
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            disabled={saving}
            onClick={handleDiscard}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            type="button"
          >
            Descartar alterações
          </button>
          <button
            className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700 disabled:opacity-60"
            disabled={saving}
            onClick={handleSave}
            type="button"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </>
  );
}
