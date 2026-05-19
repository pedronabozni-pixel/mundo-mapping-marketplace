"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

type Tab = "entrar" | "cadastrar";

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
            instagram: fd.get("instagram") as string,
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
      } else if (data.session) {
        await supabase.from("profiles").upsert({
          id: data.session.user.id,
          email: fd.get("email") as string,
          user_type: "influenciador",
          full_name: fd.get("full_name") as string,
          instagram: fd.get("instagram") as string,
        }, { onConflict: "id" });
        window.location.href = "/mundo-mapping/influenciadores";
      } else {
        setInfo("Conta criada! Verifique seu e-mail para confirmar antes de entrar.");
        setTab("entrar");
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
              <Field label="Instagram" name="instagram" placeholder="@seuhandle" />
              <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <Field label="Confirmar senha" name="confirm" placeholder="••••••••" type="password" />
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
