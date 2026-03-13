import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="brand-banner relative flex min-h-[34vh] overflow-hidden p-5 sm:min-h-[38vh] sm:p-6 lg:min-h-screen lg:items-end lg:p-12">
        <div className="max-w-xl space-y-4">
          <p className="text-xs tracking-[0.3em] text-brand">DECENTRALIZED CLUB</p>
          <h1 className="brand-title text-4xl leading-none sm:text-5xl lg:text-6xl">Crypto ecosystem</h1>
          <p className="max-w-md text-sm text-muted">
            Análises e atualizações educacionais com uma experiência premium para membros.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-3 pb-6 pt-3 sm:px-4 lg:p-10">
        <Suspense fallback={<div className="card w-full max-w-md">Carregando login...</div>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
