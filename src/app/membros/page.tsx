"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Tab = "entrar" | "cadastrar";

const inputCls =
  "w-full bg-transparent border-b border-white/10 py-3 text-[15px] text-white placeholder:text-[#333] focus:outline-none focus:border-[#C8102E] transition-colors";

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
      <label className="mb-2 block text-[12px] font-medium" style={{ color: "#888" }}>{label}</label>
      <input
        className={inputCls}
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
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-8 py-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at top, rgba(200,16,46,0.06) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 w-full" style={{ maxWidth: 420 }}>
        {/* Seal */}
        <p
          className="text-center uppercase text-[11px]"
          style={{ letterSpacing: "0.16em", color: "#888" }}
        >
          MAPPING <span style={{ color: "#C8102E" }}>·</span> PARTNERS
        </p>

        {/* Title */}
        <h1 className="mt-3 text-center font-sans text-[32px] font-extrabold tracking-[-0.02em] leading-tight text-white">
          {tab === "cadastrar" ? "Criar conta" : "Bem-vindo"}
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-center text-[14px]" style={{ color: "#888" }}>
          Acesse sua área de membros
        </p>

        {/* Tabs */}
        <div className="mt-10 flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["entrar", "cadastrar"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className="flex-1 text-[14px] font-medium bg-transparent transition-colors"
              style={{
                padding: "12px 4px",
                color: tab === t ? "#fff" : "#666",
                borderBottom: tab === t ? "2px solid #C8102E" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="mt-8">
          {error && (
            <div
              className="mb-5 rounded-lg px-[14px] py-3 text-[13px] leading-relaxed"
              style={{
                background: "rgba(200,16,46,0.08)",
                border: "1px solid rgba(200,16,46,0.2)",
                color: "#FF6B6B",
              }}
            >
              {error}
            </div>
          )}
          {info && (
            <div
              className="mb-5 rounded-lg px-[14px] py-3 text-[13px] leading-relaxed"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#4ADE80",
              }}
            >
              {info}
            </div>
          )}

          {tab === "entrar" && (
            <form className="space-y-7" onSubmit={handleSignIn}>
              <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Entrando…" : <span>Entrar <span className="opacity-70">→</span></span>}
              </button>
            </form>
          )}

          {tab === "cadastrar" && (
            <form className="space-y-7" onSubmit={handleSignUp}>
              <Field label="Nome completo" name="nome" placeholder="Seu nome" />
              <Field label="E-mail" name="email" placeholder="seu@email.com" type="email" />
              <Field label="Senha" name="password" placeholder="••••••••" type="password" />
              <Field label="Confirmar senha" name="confirm" placeholder="••••••••" type="password" />
              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Criando conta…" : <span>Criar conta <span className="opacity-70">→</span></span>}
              </button>
              <p className="text-center text-[11px]" style={{ color: "#666" }}>
                Ao criar uma conta você concorda com os{" "}
                <span className="font-medium" style={{ color: "#888" }}>Termos de Uso</span>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p
          className="mt-20 text-center text-[11px]"
          style={{ letterSpacing: "0.05em", color: "#444" }}
        >
          Sub-marca da Mundo Mapping
        </p>
      </div>
    </div>
  );
}
