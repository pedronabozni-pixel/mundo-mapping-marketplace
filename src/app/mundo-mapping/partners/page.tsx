"use client";

import { useState } from "react";
import Link from "next/link";

const PAINEL = "https://painel.mundomapping.com/empresa";

function IconCheck() {
  return (
    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="20">
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
    <nav className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]">
            <span className="text-xs font-bold text-white">MP</span>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-zinc-950">Mapping Partners</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Mundo Mapping</p>
          </div>
        </div>
        <a
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6D28D9]"
          href={`${PAINEL}/entrar`}
        >
          Entrar
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-36" style={{ background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 45%, #6D28D9 100%)" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(167,139,250,0.25) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 10% 80%, rgba(91,33,182,0.5) 0%, transparent 70%)" }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center rounded-full border border-purple-300/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-200">
          Uma sub-marca da Mundo Mapping
        </span>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.1]">
          Venda mais com creators que já têm{" "}
          <span className="text-purple-300">audiência real</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-purple-100">
          O Mapping Partners conecta sua marca a mais de 16.000 influenciadores validados, prontos para divulgar e vender por comissão.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-3.5 text-[15px] font-bold text-[#7C3AED] shadow-[0_20px_60px_-20px_rgba(255,255,255,0.35)] transition hover:bg-purple-50"
            href={`${PAINEL}/cadastrar`}
          >
            Cadastrar meu produto
          </a>
          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-purple-300/40 bg-white/10 px-8 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
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
    <section className="border-b border-zinc-100 bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              className="flex flex-col items-center rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50 to-white p-6 text-center shadow-sm"
              key={stat.label}
            >
              <span className="text-3xl font-bold text-[#7C3AED] sm:text-4xl">{stat.value}</span>
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
    <section className="bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7C3AED]">Como funciona</p>
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
                  ? "bg-[#7C3AED] text-white shadow-sm"
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
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              onClick={() => setTab("influenciador")}
              type="button"
            >
              Para influenciador
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {steps.map((step, index) => (
            <div
              className="flex items-start gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              key={step}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-sm font-bold text-[#7C3AED]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <p className="flex-1 pt-1.5 text-[15px] font-medium leading-7 text-zinc-800">{step}</p>
            </div>
          ))}
        </div>
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
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7C3AED]">Diferenciais</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Por que o Mapping Partners?
          </h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              className="group rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50/60 to-white p-8 transition hover:border-purple-200 hover:shadow-md"
              key={card.title}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                {card.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{card.desc}</p>
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
    <section className="px-6 py-20" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3B0764 100%)" }}>
      <div className="mx-auto max-w-6xl text-white">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-purple-400">Para quem é</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Feito para quem quer resultado
          </h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">Empresas</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Qualquer negócio que vende online</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Ideal para quem quer escalar vendas com marketing de performance puro.
            </p>
            <ul className="mt-6 space-y-3">
              {empresas.map((item) => (
                <li className="flex items-center gap-3 text-sm text-white/80" key={item}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/60 text-purple-200">
                    <IconCheck />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">Influenciadores</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Creators que querem monetizar</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Sem precisar de milhões de seguidores — audiência engajada já é suficiente.
            </p>
            <ul className="mt-6 space-y-3">
              {influenciadores.map((item) => (
                <li className="flex items-center gap-3 text-sm text-white/80" key={item}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/60 text-purple-200">
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
      name: "Starter",
      price: "Grátis",
      period: "",
      features: ["Até 3 produtos", "Acesso ao shopping", "Link de afiliado básico"],
      highlight: false,
      badge: null,
      cta: "Começar grátis",
    },
    {
      name: "Growth",
      price: "R$197",
      period: "/mês",
      features: ["Até 10 produtos", "Dashboard completo", "Relatórios detalhados"],
      highlight: false,
      badge: null,
      cta: "Assinar agora",
    },
    {
      name: "Scale",
      price: "R$497",
      period: "/mês",
      features: ["Produtos ilimitados", "Curadoria de creators", "Suporte prioritário"],
      highlight: true,
      badge: "Mais popular",
      cta: "Assinar agora",
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      period: "",
      features: ["Gestão completa", "Account dedicado", "SLA garantido"],
      highlight: false,
      badge: null,
      cta: "Falar com vendas",
    },
  ];

  return (
    <section className="bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7C3AED]">Planos</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Comece grátis, cresça sem limite
          </h2>
          <p className="mt-4 text-base text-zinc-500">Escolha o plano ideal para o tamanho do seu negócio.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              className={`relative flex flex-col rounded-3xl p-6 ${
                plan.highlight
                  ? "border-0 text-white shadow-[0_30px_80px_-30px_rgba(124,58,237,0.5)]"
                  : "border border-zinc-200 bg-white shadow-sm"
              }`}
              key={plan.name}
              style={plan.highlight ? { background: "linear-gradient(150deg, #7C3AED 0%, #6D28D9 100%)" } : {}}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-xs font-bold text-[#7C3AED] shadow-sm">
                  {plan.badge}
                </span>
              )}
              <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlight ? "text-purple-200" : "text-[#7C3AED]"}`}>
                {plan.name}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-zinc-950"}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.highlight ? "text-purple-200" : "text-zinc-400"}`}>{plan.period}</span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li className={`flex items-center gap-2.5 text-sm ${plan.highlight ? "text-purple-100" : "text-zinc-600"}`} key={feat}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${plan.highlight ? "bg-purple-300" : "bg-[#7C3AED]"}`} />
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${
                  plan.highlight
                    ? "bg-white text-[#7C3AED] hover:bg-purple-50"
                    : "border border-[#7C3AED]/20 bg-[#7C3AED]/5 text-[#7C3AED] hover:bg-[#7C3AED]/10"
                }`}
                href={`${PAINEL}/cadastrar`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-white" style={{ background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #6D28D9 100%)" }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(167,139,250,0.2) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Pronto para vender com creators reais?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-purple-200">
          Cadastre seu produto agora e comece a receber divulgações de influenciadores validados.
        </p>
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <a
            className="inline-flex items-center justify-center rounded-2xl bg-white px-10 py-3.5 text-base font-bold text-[#7C3AED] shadow-[0_20px_60px_-20px_rgba(255,255,255,0.4)] transition hover:bg-purple-50"
            href={`${PAINEL}/cadastrar`}
          >
            Começar agora
          </a>
          <Link
            className="text-sm font-medium text-purple-200 underline-offset-4 transition hover:text-white hover:underline"
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
    <footer className="border-t border-zinc-100 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]">
            <span className="text-xs font-bold text-white">MP</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-zinc-950">Mapping Partners</p>
            <p className="text-xs text-zinc-400">Uma sub-marca da Mundo Mapping</p>
          </div>
        </div>
        <a
          className="text-sm text-zinc-400 underline-offset-4 transition hover:text-zinc-700 hover:underline"
          href="https://mundomapping.com"
        >
          mundomapping.com
        </a>
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
