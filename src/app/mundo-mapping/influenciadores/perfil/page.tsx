"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NICHO_OPTIONS = [
  "Moda", "Gastronomia", "Turismo", "Beleza", "Tecnologia",
  "Finanças", "Fitness", "Entretenimento", "Outros",
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
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">{platform}</label>
        <div className="flex rounded-xl border border-zinc-200 bg-white overflow-hidden focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100">
          <span className="flex items-center bg-zinc-50 px-3 text-sm text-zinc-400 border-r border-zinc-200">@</span>
          <input
            className="flex-1 px-3 py-2.5 text-sm text-zinc-950 outline-none bg-transparent"
            onChange={(e) => onHandle(e.target.value)}
            placeholder="seuhandle"
            value={handle}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">{followerLabel}</label>
        <input
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          onChange={(e) => onFollowers(e.target.value)}
          placeholder="0"
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
      const supabase = createClient();
      const { error: err } = await supabase.from("profiles").upsert(
        {
          id: userId,
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
          engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) : null,
          niche: form.niche,
        },
        { onConflict: "id" }
      );
      if (err) setError(err.message);
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Configurações</p>
        <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-950">Meu perfil</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Suas informações visíveis para as empresas do marketplace.
        </p>
      </div>

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

      {/* Status card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-2xl border p-5 ${isVerified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</p>
          <p className={`mt-2 text-sm font-bold ${isVerified ? "text-emerald-700" : "text-amber-700"}`}>
            {isVerified ? "Creator verificado ✓" : "Aguardando aprovação"}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Acesso</p>
          <p className="mt-2 text-sm font-bold text-emerald-700">✓ Plataforma gratuita</p>
          <p className="mt-1 text-xs text-zinc-500">Sua receita vem 100% das comissões.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Produtos afiliados</p>
          <p className="mt-2 text-sm font-bold text-zinc-950">{activeProducts}</p>
        </div>
      </div>

      {/* Dados básicos */}
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Dados básicos</h3>
        <p className="mt-1 text-sm text-zinc-500">Suas informações pessoais e de contato.</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Avatar */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border border-zinc-200 object-cover"
                  src={avatarUrl}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-xs text-zinc-400">
                  Foto
                </div>
              )}
              <button
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Bio curta</label>
            <textarea
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none"
              maxLength={280}
              onChange={(e) => setField("bio", e.target.value)}
              placeholder="Conte um pouco sobre você e seu conteúdo…"
              rows={3}
              value={form.bio}
            />
            <p className={`mt-1 text-right text-xs ${bioLen > 260 ? "text-amber-600" : "text-zinc-400"}`}>
              {bioLen}/280
            </p>
          </div>
        </div>
      </section>

      {/* Redes sociais */}
      <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">Redes sociais e métricas</h3>
        <p className="mt-1 text-sm text-zinc-500">Handles e tamanho de audiência em cada plataforma.</p>

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
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Taxa de engajamento média (%)</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                onChange={(e) => setField("engagement_rate", e.target.value)}
                placeholder="0.0"
                step="0.1"
                type="number"
                value={form.engagement_rate}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Nicho principal</label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                onChange={(e) => setField("niche", e.target.value)}
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
