"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NICHO_OPTIONS = [
  "60+", "Afro", "Agronegócio", "Animais De Estimação", "Arquitetura",
  "Arte E Cultura", "Artesanato", "Atletas", "Autismo", "Automóveis",
  "Bebidas", "Beleza", "Cabelo", "Carreira", "Cartão De Milhas",
  "Casa", "Casamento", "Causas E ONGs", "Construção", "Crianças",
  "Cripto", "Cultura Geek", "Cyber Atletas", "Dança", "Decoração",
  "Direito", "Economia", "Educação", "Empreendedorismo", "Entretenimento",
  "Espiritualidade", "Esportes", "ESG", "Estética", "Estilo De Vida",
  "Família", "Filmes E Séries", "Finanças", "Finanças Pessoais", "Fitness",
  "Fotografia", "Futebol", "Games", "Gastronomia", "Gravidez",
  "Humor", "Imóveis", "Industrial", "Inteligência Artificial", "Jogos",
  "LGBTQI+", "Livros", "Luxo", "Manicure", "Maquiagem",
  "Marketing", "Marketing Pessoal", "Maternidade", "Médico", "Moda",
  "Motivacional", "Música", "Negócios Empresariais", "Nutrição", "Paternidade",
  "Política", "Psicologia", "Saúde", "Seguro/Seguradora", "Sexualidade",
  "Síndrome De Down", "Startup", "Streamer", "Sustentabilidade", "Tatuagem",
  "TDAH", "Tecnologia", "Vegano", "Vendas", "Vestibular",
  "Viagens", "Vida Saudável", "Vinhos",
];

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
      <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>{label}</label>
      <input
        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555]"
        name={name}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#C8102E"; }}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        placeholder={placeholder}
        readOnly={readOnly}
        style={
          readOnly
            ? { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#555", cursor: "default" }
            : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
        }
        type={type}
        value={value}
      />
      {readOnly && <p className="mt-1 text-xs" style={{ color: "#555" }}>Não é possível alterar o e-mail.</p>}
    </div>
  );
}

function SocialRow({
  platform,
  handle,
  followers,
  followerLabel,
  onHandle,
  onFollowers,
}: {
  platform: string;
  handle: string;
  followers: string;
  followerLabel: string;
  onHandle: (v: string) => void;
  onFollowers: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
      <div>
        <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>{platform}</label>
        <div
          className="flex overflow-hidden rounded-xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <span className="flex items-center px-3 text-sm" style={{ color: "#555", borderRight: "1px solid rgba(255,255,255,0.06)" }}>@</span>
          <input
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
            onChange={(e) => onHandle(e.target.value)}
            placeholder="seuhandle"
            value={handle}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>{followerLabel}</label>
        <input
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555]"
          onChange={(e) => onFollowers(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          placeholder="0"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          type="number"
          value={followers}
        />
      </div>
    </div>
  );
}

export default function InfluenciadorPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [activeProducts, setActiveProducts] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bioLen, setBioLen] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    state: "",
    bio: "",
    instagram_handle: "",
    instagram_followers: "",
    tiktok_handle: "",
    tiktok_followers: "",
    youtube_handle: "",
    youtube_subscribers: "",
    twitter_handle: "",
    twitter_followers: "",
    engagement_rate: "",
    niche: "",
    wallet_id: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "bio") setBioLen(value.length);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/mundo-mapping/influenciador/login"; return; }
      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setIsVerified(profile.is_verified ?? false);
        setAvatarUrl(profile.avatar_url ?? "");
        const next = {
          full_name: profile.full_name ?? "",
          phone: profile.phone ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "",
          bio: profile.bio ?? "",
          instagram_handle: profile.instagram_handle ?? "",
          instagram_followers: profile.instagram_followers?.toString() ?? "",
          tiktok_handle: profile.tiktok_handle ?? "",
          tiktok_followers: profile.tiktok_followers?.toString() ?? "",
          youtube_handle: profile.youtube_handle ?? "",
          youtube_subscribers: profile.youtube_subscribers?.toString() ?? "",
          twitter_handle: profile.twitter_handle ?? "",
          twitter_followers: profile.twitter_followers?.toString() ?? "",
          engagement_rate: profile.engagement_rate?.toString() ?? "",
          niche: profile.niche ?? "",
          wallet_id: profile.wallet_id ?? "",
        };
        setForm(next);
        setBioLen(next.bio.length);
      }

      const { count } = await supabase
        .from("links_afiliados")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id);
      setActiveProducts(count ?? 0);

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (form.bio.length > 280) { setError("A bio não pode ter mais de 280 caracteres."); return; }
    setSaving(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch("/api/mundo-mapping/perfil/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_url: avatarUrl,
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          state: form.state,
          bio: form.bio,
          instagram_handle: form.instagram_handle,
          instagram_followers: form.instagram_followers ? parseInt(form.instagram_followers) : null,
          tiktok_handle: form.tiktok_handle,
          tiktok_followers: form.tiktok_followers ? parseInt(form.tiktok_followers) : null,
          youtube_handle: form.youtube_handle,
          youtube_subscribers: form.youtube_subscribers ? parseInt(form.youtube_subscribers) : null,
          twitter_handle: form.twitter_handle,
          twitter_followers: form.twitter_followers ? parseInt(form.twitter_followers) : null,
          niche: form.niche,
          wallet_id: form.wallet_id.trim() || null,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) setError(out.error ?? "Erro ao salvar.");
      else setInfo("Perfil salvo com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true });
      if (upErr) { setError(upErr.message); return; }
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
    } finally {
      setUploadingAvatar(false);
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
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "#555" }}>Configurações</p>
        <h2 className="mt-2 font-sans text-[26px] font-extrabold tracking-[-0.02em] text-white">Meu perfil</h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "#888" }}>
          Suas informações visíveis para as empresas do marketplace.
        </p>
      </div>

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

      {/* Status card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="rounded-2xl p-5"
          style={
            isVerified
              ? { background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }
              : { background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }
          }
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>Status</p>
          <p className="mt-2 text-sm font-bold" style={{ color: isVerified ? "#4ADE80" : "#FBBF24" }}>
            {isVerified ? "Creator verificado ✓" : "Aguardando aprovação"}
          </p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>Acesso</p>
          <p className="mt-2 text-sm font-bold" style={{ color: "#4ADE80" }}>✓ Plataforma gratuita</p>
          <p className="mt-1 text-xs" style={{ color: "#555" }}>Sua receita vem 100% das comissões.</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>Produtos afiliados</p>
          <p className="mt-2 text-sm font-bold text-white">{activeProducts}</p>
        </div>
      </div>

      {/* Dados básicos */}
      <section className="rounded-[24px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-lg font-semibold tracking-tight text-white">Dados básicos</h3>
        <p className="mt-1 text-sm" style={{ color: "#888" }}>Suas informações pessoais e de contato.</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Avatar */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Foto de perfil</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                  src={avatarUrl}
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full text-xs" style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#555" }}>
                  Foto
                </div>
              )}
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                type="button"
              >
                {uploadingAvatar ? "Enviando…" : "Alterar foto"}
              </button>
              <input accept="image/*" className="hidden" onChange={handleAvatarUpload} ref={fileRef} type="file" />
            </div>
          </div>

          <Field label="Nome completo" name="full_name" onChange={(v) => setField("full_name", v)} placeholder="Seu nome" value={form.full_name} />
          <Field label="E-mail" name="email" readOnly value={email} />
          <Field label="Telefone" name="phone" onChange={(v) => setField("phone", v)} placeholder="(11) 99999-9999" value={form.phone} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade" name="city" onChange={(v) => setField("city", v)} placeholder="São Paulo" value={form.city} />
            <Field label="Estado" name="state" onChange={(v) => setField("state", v)} placeholder="SP" value={form.state} />
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Bio curta</label>
            <textarea
              className="w-full resize-none rounded-xl px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555]"
              maxLength={280}
              onChange={(e) => setField("bio", e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              placeholder="Conte um pouco sobre você e seu conteúdo…"
              rows={3}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              value={form.bio}
            />
            <p className={`mt-1 text-right text-xs`} style={{ color: bioLen > 260 ? "#FBBF24" : "#555" }}>
              {bioLen}/280
            </p>
          </div>
        </div>
      </section>

      {/* Redes sociais */}
      <section className="rounded-[24px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-lg font-semibold tracking-tight text-white">Redes sociais e métricas</h3>
        <p className="mt-1 text-sm" style={{ color: "#888" }}>Handles e tamanho de audiência em cada plataforma.</p>

        <div className="mt-5 space-y-4">
          <SocialRow
            followerLabel="Seguidores"
            followers={form.instagram_followers}
            handle={form.instagram_handle}
            onFollowers={(v) => setField("instagram_followers", v)}
            onHandle={(v) => setField("instagram_handle", v)}
            platform="Instagram"
          />
          <SocialRow
            followerLabel="Seguidores"
            followers={form.tiktok_followers}
            handle={form.tiktok_handle}
            onFollowers={(v) => setField("tiktok_followers", v)}
            onHandle={(v) => setField("tiktok_handle", v)}
            platform="TikTok"
          />
          <SocialRow
            followerLabel="Inscritos"
            followers={form.youtube_subscribers}
            handle={form.youtube_handle}
            onFollowers={(v) => setField("youtube_subscribers", v)}
            onHandle={(v) => setField("youtube_handle", v)}
            platform="YouTube"
          />
          <SocialRow
            followerLabel="Seguidores"
            followers={form.twitter_followers}
            handle={form.twitter_handle}
            onFollowers={(v) => setField("twitter_followers", v)}
            onHandle={(v) => setField("twitter_handle", v)}
            platform="Twitter / X"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Taxa de engajamento média (%)</label>
              <div className="flex cursor-default items-center rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-sm" style={{ color: form.engagement_rate ? "#aaa" : "#555", fontStyle: form.engagement_rate ? "normal" : "italic" }}>
                  {form.engagement_rate ? `${form.engagement_rate}%` : "Aguardando análise"}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "#555" }}>Calculada pela equipe Mapping Partners.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Nicho principal</label>
              <select
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                onChange={(e) => setField("niche", e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                value={form.niche}
              >
                <option value="">Selecione…</option>
                {NICHO_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Pagamentos */}
      <section className="rounded-[24px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-lg font-semibold tracking-tight text-white">Pagamentos</h3>
        <p className="mt-1 text-sm" style={{ color: "#888" }}>Configurações para recebimento de comissões via Asaas.</p>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Wallet ID Asaas</label>
          <input
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555]"
            onChange={(e) => setField("wallet_id", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            placeholder="ex: wal_xxxxxxxxxxxxxxxx"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            type="text"
            value={form.wallet_id}
          />
          <p className="mt-1.5 text-xs leading-5" style={{ color: "#555" }}>
            Cole aqui o ID da sua carteira Asaas. Se não tiver, deixe vazio que criaremos automaticamente.
          </p>
        </div>
      </section>

      <div>
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
  );
}
