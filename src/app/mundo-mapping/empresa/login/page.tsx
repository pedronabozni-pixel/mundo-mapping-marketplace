"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "entrar" | "cadastrar";

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-red-600">
        <span className="text-sm font-bold text-white">MP</span>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold tracking-tight text-zinc-950">Mapping Partners</p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Área da Empresa</p>
      </div>
    </div>
  );
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

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
      disabled={loading}
      onClick={onClick}
      type="button"
    >
      <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
      </svg>
      Entrar com Google
    </button>
  );
}

export default function EmpresaLoginPage() {
  const [tab, setTab] = useState<Tab>("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  const router = useRouter();

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
    const supabase = createClient();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get("email") as string,
      password: fd.get("password") as string,
    });
    if (error) setError("E-mail ou senha incorretos.");
    else { router.push("/mundo-mapping/afiliados"); router.refresh(); }
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    const supabase = createClient();
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: fd.get("email") as string,
      password,
      options: {
        data: {
          user_type: "empresa",
          company_name: fd.get("company_name") as string,
          cnpj: fd.get("cnpj") as string,
        },
        emailRedirectTo: `${window.location.origin}/mundo-mapping/empresa/dashboard`,
      },
    });
    if (error) setError(error.message);
    else { router.push("/mundo-mapping/afiliados"); router.refresh(); }
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    const supabase = createClient();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.resetPasswordForEmail(
      fd.get("email") as string,
      { redirectTo: `${window.location.origin}/mundo-mapping/empresa/login` }
    );
    if (error) setError(error.message);
    else setInfo("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/mundo-mapping/empresa/dashboard` },
    });
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

        <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {info && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>
          )}

          {tab === "entrar" && !forgot && (
            <form className="space-y-4" onSubmit={handleSignIn}>
              <Field label="E-mail" name="email" placeholder="empresa@email.com" type="email" />
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
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs text-zinc-400">ou</span>
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
              <GoogleButton loading={loading} onClick={handleGoogle} />
            </form>
          )}

          {tab === "entrar" && forgot && (
            <form className="space-y-4" onSubmit={handleForgot}>
              <div>
                <p className="mb-4 text-sm leading-6 text-zinc-500">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <Field label="E-mail" name="email" placeholder="empresa@email.com" type="email" />
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
              <Field label="Nome da empresa" name="company_name" placeholder="Empresa Ltda." />
              <Field label="CNPJ" name="cnpj" placeholder="00.000.000/0001-00" />
              <Field label="E-mail" name="email" placeholder="empresa@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <Field label="Confirmar senha" name="confirm" placeholder="••••••••" type="password" />
              <button
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] transition hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Criando conta…" : "Criar conta"}
              </button>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs text-zinc-400">ou</span>
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
              <GoogleButton loading={loading} onClick={handleGoogle} />
              <p className="text-center text-xs text-zinc-400">
                Ao cadastrar, você concorda com os{" "}
                <span className="font-medium text-zinc-600">Termos de Uso</span>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          É influenciador?{" "}
          <Link
            className="font-semibold text-zinc-900 underline-offset-4 hover:underline"
            href="/mundo-mapping/influenciador/login"
          >
            Acesse aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
