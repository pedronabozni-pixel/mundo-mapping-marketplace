"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "entrar" | "cadastrar";

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

const inputCls =
  "w-full bg-transparent border-b border-white/10 py-3 text-[15px] text-white placeholder:text-[#333] focus:outline-none focus:border-[#C8102E] transition-colors";

export default function EmpresaLoginPage() {
  const [tab, setTab] = useState<Tab>("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState("");

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
      else window.location.href = "/mundo-mapping/afiliados";
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
      if (cpfCnpj) {
        const checkRes = await fetch("/api/auth/check-cpf-cnpj", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf_cnpj: cpfCnpj }),
        });
        const { exists } = await checkRes.json() as { exists: boolean };
        if (exists) {
          setError("Este CPF/CNPJ já está cadastrado na plataforma.");
          return;
        }
      }
      const { data, error } = await supabase.auth.signUp({
        email: fd.get("email") as string,
        password,
        options: {
          data: {
            user_type: "empresa",
            full_name: fd.get("company_name") as string,
            company_name: fd.get("company_name") as string,
            cpf_cnpj: cpfCnpj,
          },
          emailRedirectTo: `${window.location.origin}/mundo-mapping/empresa/dashboard`,
        },
      });
      if (error) {
        if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
          setError("__duplicate_email__");
        } else if (error.message?.toLowerCase().includes("invalid login") || error.message?.toLowerCase().includes("invalid credentials")) {
          setError("E-mail ou senha incorretos.");
        } else {
          console.error("[auth_error]", error.message);
          setError("Não foi possível concluir a operação. Tente novamente em instantes.");
        }
      } else if (data.user && (data.user.identities?.length ?? 1) === 0) {
        setError("__duplicate_email__");
      } else if (data.user) {
        await fetch("/api/mundo-mapping/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            profile: {
              email: fd.get("email") as string,
              user_type: "empresa",
              full_name: fd.get("company_name") as string,
              cpf_cnpj: cpfCnpj || null,
            },
          }),
        });
        if (data.session) {
          try {
            await fetch("/api/mundo-mapping/empresas/create-wallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: data.session.access_token }),
            });
          } catch {
            // Falha silenciosa — não bloqueia o cadastro
          }
          window.location.href = "/mundo-mapping/afiliados";
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
        { redirectTo: `${window.location.origin}/mundo-mapping/empresa/login` }
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
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-8 py-16"
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
        <h1 className="mt-3 text-center font-serif text-[32px] font-normal leading-tight text-white">
          {tab === "cadastrar" ? "Criar conta" : "Bem-vindo"}
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-center text-[14px]" style={{ color: "#888" }}>
          Acesse a área da sua empresa
        </p>

        {/* Tabs */}
        <div
          className="mt-10 flex"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
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
              {t === "entrar" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="mt-8">
          {/* Error */}
          {error && (
            <div
              className="mb-5 rounded-lg px-[14px] py-3 text-[13px] leading-relaxed"
              style={{
                background: "rgba(200,16,46,0.08)",
                border: "1px solid rgba(200,16,46,0.2)",
                color: "#FF6B6B",
              }}
            >
              {error === "__duplicate_email__" ? (
                <>
                  Este e-mail já está cadastrado.{" "}
                  <button
                    className="font-semibold underline underline-offset-2"
                    onClick={() => switchTab("entrar")}
                    type="button"
                  >
                    Fazer login
                  </button>{" "}
                  ou use outro e-mail.
                </>
              ) : (
                error
              )}
            </div>
          )}

          {/* Info / success */}
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

          {/* Sign in */}
          {tab === "entrar" && !forgot && (
            <form className="space-y-7" onSubmit={handleSignIn}>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="empresa@dominio.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-medium" style={{ color: "#888" }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="text-[12px] transition-colors hover:text-white"
                    style={{ color: "#666" }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <input
                  className={inputCls}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

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

          {/* Forgot password */}
          {tab === "entrar" && forgot && (
            <form className="space-y-7" onSubmit={handleForgot}>
              <p className="text-[14px] leading-relaxed" style={{ color: "#888" }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="empresa@dominio.com"
                  required
                />
              </div>

              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Enviando…" : <span>Enviar link <span className="opacity-70">→</span></span>}
              </button>

              <button
                type="button"
                onClick={() => setForgot(false)}
                className="w-full text-center text-[13px] transition-colors hover:text-white"
                style={{ color: "#666" }}
              >
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* Sign up */}
          {tab === "cadastrar" && (
            <form className="space-y-7" onSubmit={handleSignUp}>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Nome / Razão social
                </label>
                <input
                  className={inputCls}
                  name="company_name"
                  placeholder="Empresa Ltda. ou seu nome"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  CPF / CNPJ
                </label>
                <input
                  className={inputCls}
                  name="cpf_cnpj"
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={cpfCnpj}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="empresa@dominio.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Senha
                </label>
                <input
                  className={inputCls}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Confirmar senha
                </label>
                <input
                  className={inputCls}
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Criando conta…" : <span>Criar conta <span className="opacity-70">→</span></span>}
              </button>

              <p className="text-center text-[11px]" style={{ color: "#666" }}>
                Ao cadastrar, você concorda com os{" "}
                <span className="font-medium" style={{ color: "#888" }}>
                  Termos de Uso
                </span>
              </p>
            </form>
          )}
        </div>

        {/* Cross link */}
        <p className="mt-8 text-center text-[13px]" style={{ color: "#666" }}>
          É influenciador?{" "}
          <Link
            href="/mundo-mapping/influenciador/login"
            className="font-medium text-white"
          >
            Acesse aqui
          </Link>
        </p>

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
