"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

type Tab = "entrar" | "cadastrar";

const NICHO_OPTIONS = [
  "Moda", "Gastronomia", "Turismo", "Beleza", "Tecnologia",
  "Finanças", "Fitness", "Entretenimento", "Outros",
];

function Logo() {
  return <MappingPartnersLogo size="lg" subtitle="Área do Creator" variant="stacked" />;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </div>
  );
}

export default function InfluenciadorLoginPage() {
  const [tab, setTab] = useState<Tab>("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [hasAsaasAccount, setHasAsaasAccount] = useState(false);

  function reset() {
    setError(null);
    setInfo(null);
    setForgot(false);
  }

  function switchTab(t: Tab) {
    setTab(t);
    reset();
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const { error } = await supabase.auth.signInWithPassword({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      });
      if (error) setError("E-mail ou senha incorretos.");
      else window.location.href = "/mundo-mapping/influenciadores";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const password = fd.get("password") as string;
      const confirm = fd.get("confirm") as string;
      if (password !== confirm) {
        setError("As senhas não coincidem.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: fd.get("email") as string,
        password,
        options: {
          data: {
            user_type: "influenciador",
            full_name: fd.get("full_name") as string,
          },
          emailRedirectTo: `${window.location.origin}/mundo-mapping/influenciador/dashboard`,
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
          setError("__duplicate_email__");
        } else {
          setError(error.message);
        }
      } else if (data.user && (data.user.identities?.length ?? 1) === 0) {
        setError("__duplicate_email__");
      } else if (data.user) {
        const rawWalletId = (fd.get("wallet_id") as string | null)?.trim() || null;
        const num = (name: string) => { const v = parseInt(fd.get(name) as string); return isNaN(v) ? null : v; };
        const str = (name: string) => (fd.get(name) as string | null)?.trim() || null;
        await fetch("/api/mundo-mapping/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            profile: {
              email: fd.get("email") as string,
              user_type: "influenciador",
              full_name: str("full_name"),
              cpf_cnpj: str("cpf_cnpj"),
              phone: str("phone"),
              instagram_handle: str("instagram_handle"),
              instagram_followers: num("instagram_followers"),
              tiktok_handle: str("tiktok_handle"),
              tiktok_followers: num("tiktok_followers"),
              youtube_handle: str("youtube_handle"),
              youtube_subscribers: num("youtube_subscribers"),
              twitter_handle: str("twitter_handle"),
              twitter_followers: num("twitter_followers"),
              niche: str("niche"),
              ...(rawWalletId ? { wallet_id: rawWalletId } : {}),
            },
          }),
        });

        if (data.session) {
          // Cria wallet Asaas automaticamente se não informou manualmente
          if (!rawWalletId) {
            try {
              await fetch("/api/mundo-mapping/influenciadores/create-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ access_token: data.session.access_token }),
              });
            } catch {
              // Falha silenciosa
            }
          }
          window.location.href = "/mundo-mapping/influenciadores";
        } else {
          setInfo("Conta criada! Verifique seu e-mail para confirmar antes de entrar.");
          setTab("entrar");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const { error } = await supabase.auth.resetPasswordForEmail(
        fd.get("email") as string,
        { redirectTo: `${window.location.origin}/mundo-mapping/influenciador/login` }
      );
      if (error) setError(error.message);
      else setInfo("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Logo />

        <div className="mt-8 flex w-full rounded-full border border-zinc-200 bg-white p-1">
          {(["entrar", "cadastrar"] as Tab[]).map((t) => (
            <button
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                tab === t ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
              }`}
              key={t}
              onClick={() => switchTab(t)}
              type="button"
            >
              {t === "entrar" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)] sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error === "__duplicate_email__" ? (
                <>
                  Este e-mail já está cadastrado.{" "}
                  <button className="font-semibold underline underline-offset-2" onClick={() => switchTab("entrar")} type="button">
                    Fazer login
                  </button>
                  {" "}ou use outro e-mail.
                </>
              ) : error}
            </div>
          )}
          {info && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>
          )}

          {tab === "entrar" && !forgot && (
            <form className="space-y-4" onSubmit={handleSignIn}>
              <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <button
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] transition hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
              <button
                className="w-full text-center text-sm text-zinc-400 underline-offset-4 hover:text-zinc-600 hover:underline"
                onClick={() => setForgot(true)}
                type="button"
              >
                Esqueci minha senha
              </button>
            </form>
          )}

          {tab === "entrar" && forgot && (
            <form className="space-y-4" onSubmit={handleForgot}>
              <div>
                <p className="mb-4 text-sm leading-6 text-zinc-500">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              </div>
              <button
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] transition hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
              <button
                className="w-full text-center text-sm text-zinc-400 underline-offset-4 hover:text-zinc-600 hover:underline"
                onClick={() => setForgot(false)}
                type="button"
              >
                Voltar para o login
              </button>
            </form>
          )}

          {tab === "cadastrar" && (
            <form className="space-y-4" onSubmit={handleSignUp}>
              <Field label="Nome completo" name="full_name" placeholder="Seu nome" />
              <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <Field label="Confirmar senha" name="confirm" placeholder="••••••••" type="password" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF / CNPJ" name="cpf_cnpj" placeholder="000.000.000-00" required={false} />
                <Field label="Celular" name="phone" placeholder="(11) 99999-9999" required={false} />
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Redes sociais (opcional)</p>
                {(
                  [
                    { platform: "Instagram", handleName: "instagram_handle", followersName: "instagram_followers", followerLabel: "Seguidores" },
                    { platform: "TikTok", handleName: "tiktok_handle", followersName: "tiktok_followers", followerLabel: "Seguidores" },
                    { platform: "YouTube", handleName: "youtube_handle", followersName: "youtube_subscribers", followerLabel: "Inscritos" },
                    { platform: "Twitter / X", handleName: "twitter_handle", followersName: "twitter_followers", followerLabel: "Seguidores" },
                  ] as const
                ).map(({ platform, handleName, followersName, followerLabel }) => (
                  <div className="grid grid-cols-[1fr_108px] gap-2" key={platform}>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-600">{platform}</label>
                      <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100">
                        <span className="flex items-center bg-zinc-50 px-3 text-xs text-zinc-400 border-r border-zinc-200">@</span>
                        <input className="flex-1 px-3 py-2 text-sm text-zinc-950 outline-none bg-transparent" name={handleName} placeholder="seuhandle" type="text" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-600">{followerLabel}</label>
                      <input className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" min="0" name={followersName} placeholder="0" type="number" />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Nicho principal</label>
                  <select className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" name="niche">
                    <option value="">Selecione…</option>
                    {NICHO_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    checked={hasAsaasAccount}
                    className="h-4 w-4 rounded border-zinc-300 accent-red-600"
                    onChange={(e) => setHasAsaasAccount(e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm font-medium text-zinc-700">Já tenho conta Asaas</span>
                </label>
                {hasAsaasAccount && (
                  <div>
                    <input
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      name="wallet_id"
                      placeholder="ex: wal_xxxxxxxxxxxxxxxx"
                      type="text"
                    />
                    <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                      Cole aqui o ID da sua carteira Asaas para receber comissões automaticamente.
                    </p>
                  </div>
                )}
              </div>

              <button
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] transition hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Criando conta…" : "Criar conta"}
              </button>
              <p className="text-center text-xs text-zinc-400">
                Ao cadastrar, você concorda com os{" "}
                <span className="font-medium text-zinc-600">Termos de Uso</span>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          É empresa?{" "}
          <Link
            className="font-semibold text-zinc-900 underline-offset-4 hover:underline"
            href="/mundo-mapping/empresa/login"
          >
            Acesse aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
