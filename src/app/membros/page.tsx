"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

type Tab = "entrar" | "cadastrar";

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

export default function MembrosLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function reset() {
    setError(null);
    setInfo(null);
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
      else router.push("/membros/cursos");
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
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: fd.get("email") as string,
        password,
        options: { data: { nome: fd.get("nome") as string } },
      });
      if (error) {
        setError(error.message);
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,#fff7f7_0%,#f6f7fb_24%,#f4f5f7_100%)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <MappingPartnersLogo size="lg" subtitle="Área de Membros" variant="stacked" />
        </div>

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
              {t === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {info}
            </div>
          )}

          {tab === "entrar" && (
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
            </form>
          )}

          {tab === "cadastrar" && (
            <form className="space-y-4" onSubmit={handleSignUp}>
              <Field label="Nome completo" name="nome" placeholder="Seu nome" />
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
                Ao criar uma conta você concorda com os{" "}
                <span className="font-medium text-zinc-600">Termos de Uso</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
