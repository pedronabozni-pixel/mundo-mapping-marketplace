"use client";

import { useState } from "react";
import Link from "next/link";

function IconCheck() {
  return (
    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="14">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="22">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="22">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="22">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-violet-700">
            <span className="text-xs font-bold text-white">MP</span>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-zinc-950">Mapping Partners</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Mundo Mapping</p>
          </div>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(109,40,217,0.7)] transition hover:bg-violet-800"
          href="/mundo-mapping/afiliados"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-none bg-[linear-gradient(135deg,#18181b_0%,#4C1D95_100%)] px-6 py-24 text-white lg:py-32">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 80% 10%, rgba(167,139,250,0.2) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 50% at 10% 90%, rgba(109,40,217,0.35) 0%, transparent 70%)" }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Uma sub-marca da Mundo Mapping
        </span>
        <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
          Venda mais com creators que já têm{" "}
          <span className="text-violet-300">audiência real</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
          O Mapping Partners conecta sua marca a mais de 16.000 influenciadores validados, prontos para divulgar e vender por comissão.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-[15px] font-bold text-violet-700 shadow-[0_16px_40px_-16px_rgba(255,255,255,0.35)] transition hover:bg-violet-50"
            href="/mundo-mapping/afiliados"
          >
            Cadastrar meu produto
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            href="/mundo-mapping/influenciadores"
          >
            Sou influenciador
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  const stats = [
    { value: "+16.000", label: "creators validados" },
    { value: "+80", label: "nichos cobertos" },
    { value: "1.950", label: "cidades no Brasil" },
    { value: "R$5mi+", label: "em vendas geradas" },
  ];

  return (
    <section className="border-b border-zinc-200/80 bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-[0_18px_60px_-45px_rgba(24,24,27,0.28)]"
              key={stat.label}
            >
              <span className="text-3xl font-bold text-violet-700 sm:text-4xl">{stat.value}</span>
              <span className="mt-2 text-sm font-medium text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [tab, setTab] = useState<"empresa" | "influenciador">("empresa");

  const empresaSteps = [
    "Cadastre seu produto com preço e comissão",
    "Defina critérios de elegibilidade (nicho, score mínimo)",
    "Receba divulgação de creators qualificados",
    "Pague somente pelo resultado gerado",
  ];

  const influenciadorSteps = [
    "Acesse o Shopping de produtos disponíveis",
    "Escolha produtos alinhados ao seu nicho",
    "Receba seu link exclusivo de afiliado",
    "Divulgue e receba comissão por cada venda",
  ];

  const steps = tab === "empresa" ? empresaSteps : influenciadorSteps;

  return (
    <section className="bg-[#f3f4f6] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Como funciona</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Simples para todos os lados
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-500">
            Seja empresa ou influenciador, o processo é direto e orientado a resultado.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition ${
                tab === "empresa"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              onClick={() => setTab("empresa")}
              type="button"
            >
              Para empresa
            </button>
            <button
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition ${
                tab === "influenciador"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              onClick={() => setTab("influenciador")}
              type="button"
            >
              Para influenciador
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <div
              className="flex items-start gap-5 rounded-[20px] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_-45px_rgba(24,24,27,0.2)]"
              key={step}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">
                {String(index + 1).padStart(2, "0")}
              </div>
              <p className="flex-1 pt-1.5 text-[15px] font-medium leading-7 text-zinc-700">{step}</p>
            </div>
          ))}
        </div>

        {tab === "influenciador" && (
          <div className="mt-6 text-center">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
              href="/mundo-mapping/influenciadores"
            >
              Acessar área do influenciador
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Differentials() {
  const cards = [
    {
      icon: <IconStar />,
      title: "Só creators aprovados",
      desc: "Curadoria humana com 20% de reprovação. Apenas influenciadores com audiência real e engajamento genuíno passam para a plataforma.",
    },
    {
      icon: <IconShield />,
      title: "Contrato automático",
      desc: "Validade jurídica, sem burocracia. O contrato é gerado e assinado digitalmente no momento do cadastro, sem papelada.",
    },
    {
      icon: <IconZap />,
      title: "Pague por resultado",
      desc: "Comissão somente sobre vendas geradas. Nenhum custo antecipado — risco zero para a empresa no modelo de performance.",
    },
  ];

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Diferenciais</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Por que o Mapping Partners?
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              className="rounded-[24px] border border-zinc-200 bg-white p-7 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)] transition hover:border-zinc-300"
              key={card.title}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                {card.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-zinc-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForWhom() {
  const empresas = ["E-commerces", "Infoprodutores", "Marcas físicas", "Turismo e hotelaria", "PMEs"];
  const influenciadores = ["Nano e micro creators", "Qualquer nicho", "De qualquer cidade do Brasil", "Com ou sem CNPJ", "Comece sem custo"];

  return (
    <section className="bg-[#181a20] px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Para quem é</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Feito para quem quer resultado
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Empresas</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Qualquer negócio que vende online</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Ideal para quem quer escalar vendas com marketing de performance puro.
            </p>
            <ul className="mt-6 space-y-3">
              {empresas.map((item) => (
                <li className="flex items-center gap-3 text-sm text-white/75" key={item}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-700/50 text-violet-300">
                    <IconCheck />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Influenciadores</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Creators que querem monetizar</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Sem precisar de milhões de seguidores — audiência engajada já é suficiente.
            </p>
            <ul className="mt-6 space-y-3">
              {influenciadores.map((item) => (
                <li className="flex items-center gap-3 text-sm text-white/75" key={item}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-700/50 text-violet-300">
                    <IconCheck />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const plans = [
    {
      name: "Associate",
      price: "Grátis",
      period: "",
      fee: "10% de taxa por venda gerada",
      features: [
        "Até 3 produtos no shopping",
        "Acesso à base de +16k creators",
        "Link de afiliado básico",
      ],
      highlight: false,
      badge: null,
      cta: "Começar grátis",
    },
    {
      name: "Partner",
      price: "R$117",
      period: "/mês",
      fee: "8% de taxa por venda gerada",
      features: [
        "Produtos ilimitados",
        "Dashboard de performance completo",
        "Curadoria automática por nicho",
        "Suporte via chat",
      ],
      highlight: true,
      badge: "Mais popular",
      cta: "Assinar agora",
    },
    {
      name: "Elite",
      price: "R$197",
      period: "/mês",
      fee: "6% de taxa por venda gerada",
      features: [
        "Tudo do Partner",
        "Curadoria humana de creators",
        "Materiais de venda personalizados",
        "Account manager dedicado",
        "Relatórios avançados de GMV",
      ],
      highlight: false,
      badge: null,
      cta: "Assinar agora",
    },
  ];

  return (
    <section className="bg-[#f3f4f6] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Planos</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Entrada gratuita, escala com resultado
          </h2>
          <p className="mt-4 text-base text-zinc-500">
            Comece sem custo e pague uma taxa sobre as vendas geradas. Planos pagos reduzem a taxa e liberam funcionalidades premium.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              className={`relative flex flex-col rounded-[24px] p-7 ${
                plan.highlight
                  ? "bg-[linear-gradient(135deg,#18181b_0%,#4C1D95_100%)] text-white shadow-[0_30px_80px_-30px_rgba(109,40,217,0.5)]"
                  : "border border-zinc-200 bg-white shadow-[0_18px_60px_-45px_rgba(24,24,27,0.22)]"
              }`}
              key={plan.name}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-xs font-bold text-violet-700 shadow-sm ring-1 ring-zinc-200">
                  {plan.badge}
                </span>
              )}
              <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlight ? "text-violet-300" : "text-violet-700"}`}>
                {plan.name}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-zinc-950"}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-zinc-400"}`}>{plan.period}</span>
                )}
              </div>
              <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${plan.highlight ? "bg-white/10 text-violet-200" : "bg-violet-50 text-violet-700"}`}>
                {plan.fee}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li className={`flex items-center gap-2.5 text-sm ${plan.highlight ? "text-white/75" : "text-zinc-600"}`} key={feat}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${plan.highlight ? "bg-violet-400" : "bg-violet-600"}`} />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${
                  plan.highlight
                    ? "bg-white text-violet-700 hover:bg-violet-50"
                    : "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                }`}
                href="/mundo-mapping/afiliados"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-zinc-400">
          Em todos os planos, a Mapping Partners retém uma taxa sobre cada venda gerada pelos seus afiliados. Quanto maior o plano, menor a taxa.
        </p>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#18181b_0%,#4C1D95_100%)] px-6 py-24 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(167,139,250,0.15) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Pronto para vender com creators reais?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-white/60">
          Cadastre seu produto agora e comece a receber divulgações de influenciadores validados.
        </p>
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-white px-10 py-3 text-base font-bold text-violet-700 shadow-[0_16px_40px_-16px_rgba(255,255,255,0.35)] transition hover:bg-violet-50"
            href="/mundo-mapping/afiliados"
          >
            Começar agora
          </Link>
          <Link
            className="text-sm font-medium text-white/50 underline-offset-4 transition hover:text-white hover:underline"
            href="/mundo-mapping/influenciadores"
          >
            Já sou influenciador da Mundo Mapping
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-violet-700">
            <span className="text-xs font-bold text-white">MP</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-zinc-950">Mapping Partners</p>
            <p className="text-xs text-zinc-400">Uma sub-marca da Mundo Mapping</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MappingPartnersPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Metrics />
        <HowItWorks />
        <Differentials />
        <ForWhom />
        <Plans />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
