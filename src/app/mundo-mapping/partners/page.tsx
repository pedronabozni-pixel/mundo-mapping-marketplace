"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

// ─── Animation helpers ────────────────────────────────────────────────────────

const ease = [0.21, 0.47, 0.32, 0.98] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, duration = 2.2) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startMs = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - startMs) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { count, ref };
}

// ─── 3D tilt hook ─────────────────────────────────────────────────────────────

function useTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12;
    setTilt({ x, y });
  }, []);
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);
  const style = {
    transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: "transform 0.1s ease",
  };
  return { onMove, onLeave, style };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="13">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
      <rect height="18" rx="2" width="16" x="4" y="2" /><line x1="9" x2="9" y1="22" y2="12" /><line x1="15" x2="15" y1="22" y2="12" /><line x1="4" x2="20" y1="12" y2="12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ─── Eyebrow label ────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500/80">
        {children}
      </span>
    </div>
  );
}

// ─── Global styles (shimmer, grid, gradient animation) ────────────────────────

const globalStyles = `
  @keyframes shimmer {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(250%) skewX(-15deg); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-20px) scale(1.02); }
  }
  @keyframes blob-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(40px, -30px) scale(1.08); }
    66%       { transform: translate(-20px, 20px) scale(0.95); }
  }
  @keyframes blob-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(-50px, 20px) scale(1.05); }
    66%       { transform: translate(30px, -40px) scale(0.92); }
  }
  .btn-shimmer { position: relative; overflow: hidden; }
  .btn-shimmer::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -60%;
    width: 40%;
    height: 200%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    opacity: 0;
    pointer-events: none;
  }
  .btn-shimmer:hover::after {
    opacity: 1;
    animation: shimmer 0.55s ease forwards;
  }
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .line-gradient {
    background: linear-gradient(90deg, transparent, #dc2626, transparent);
    height: 1px;
  }
`;

// ─── 1. NAVBAR ────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <MappingPartnersLogo onDark size="md" subtitle="Mundo Mapping" />

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium text-white/60 transition hover:text-white"
            href="/mundo-mapping/empresa/login"
          >
            Entrar
          </Link>
          <Link
            className="btn-shimmer inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500"
            href="/mundo-mapping/afiliados"
          >
            Cadastrar produto
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 sm:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          type="button"
        >
          <span className={`block h-0.5 w-5 bg-white/80 transition-transform origin-center ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white/80 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white/80 transition-transform origin-center ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl sm:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <Link className="rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white" href="/mundo-mapping/empresa/login">
                Entrar como empresa
              </Link>
              <Link className="rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white" href="/mundo-mapping/influenciadores">
                Sou influenciador
              </Link>
              <Link className="mt-2 rounded-xl bg-red-600 px-3 py-3 text-center text-sm font-bold text-white" href="/mundo-mapping/afiliados">
                Cadastrar meu produto
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── 2. HERO ──────────────────────────────────────────────────────────────────

const heroWords = "Venda mais com creators que têm audiência real".split(" ");

const creatorAvatars = [
  { initials: "AM", color: "#7c3aed" },
  { initials: "LF", color: "#0891b2" },
  { initials: "CS", color: "#059669" },
  { initials: "RB", color: "#d97706" },
  { initials: "JP", color: "#db2777" },
  { initials: "TN", color: "#4f46e5" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a]">
      {/* Animated gradient blobs */}
      <div
        className="pointer-events-none absolute -right-60 -top-60 h-[700px] w-[700px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #dc2626 0%, transparent 70%)", animation: "blob-1 12s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-60 h-[600px] w-[600px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #991b1b 0%, transparent 70%)", animation: "blob-2 15s ease-in-out infinite" }}
      />
      {/* Dot grid */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-32 text-center lg:pt-40">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-4 py-1.5 text-xs font-semibold text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Plataforma de afiliados com creators validados
          </span>
        </motion.div>

        {/* Title — word by word */}
        <h1 className="mx-auto mt-8 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          {heroWords.map((word, i) => (
            <span key={i} className="inline-block">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25 + i * 0.07, ease }}
              >
                {word === "creators" || word === "audiência" ? (
                  <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : word}
              </motion.span>
              {i < heroWords.length - 1 && " "}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/55 sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease }}
        >
          O Mapping Partners conecta sua marca a mais de 16.000 influenciadores validados, prontos para divulgar e vender por comissão.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.05, ease }}
        >
          <Link
            className="btn-shimmer inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-8 text-[15px] font-bold text-white shadow-[0_0_40px_rgba(220,38,38,0.35)] transition hover:bg-red-500 hover:shadow-[0_0_60px_rgba(220,38,38,0.5)]"
            href="/mundo-mapping/afiliados"
          >
            Cadastrar meu produto
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 text-[15px] font-semibold text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            href="/mundo-mapping/influenciadores"
          >
            Sou influenciador →
          </Link>
        </motion.div>

        {/* Creator avatars */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <div className="flex items-center -space-x-2">
            {creatorAvatars.map((a, i) => (
              <div
                key={a.initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0a0a0a] text-xs font-bold text-white"
                style={{ backgroundColor: a.color, zIndex: creatorAvatars.length - i }}
              >
                {a.initials}
              </div>
            ))}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-zinc-800 text-xs font-bold text-white/60" style={{ zIndex: 0 }}>
              +16k
            </div>
          </div>
          <p className="text-xs text-white/35">16.000+ creators validados prontos para vender</p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 3. METRICS ───────────────────────────────────────────────────────────────

type Stat = { prefix: string; value: number; suffix: string; label: string; format: (n: number) => string };

function MetricCard({ stat }: { stat: Stat }) {
  const { count, ref } = useCounter(stat.value);
  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 text-center backdrop-blur-sm"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease }}
    >
      <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {stat.prefix}{stat.format(count)}{stat.suffix}
      </span>
      <span className="mt-3 text-sm text-white/45">{stat.label}</span>
    </motion.div>
  );
}

function Metrics() {
  const stats: Stat[] = [
    { prefix: "+", value: 16000, suffix: "", label: "creators validados", format: (n) => n.toLocaleString("pt-BR") },
    { prefix: "+", value: 80, suffix: "", label: "nichos cobertos", format: (n) => String(n) },
    { prefix: "", value: 1950, suffix: "", label: "cidades no Brasil", format: (n) => n.toLocaleString("pt-BR") },
    { prefix: "R$", value: 8, suffix: "mi+", label: "em vendas geradas", format: (n) => String(n) },
  ];

  return (
    <section className="bg-[#0a0a0a] px-6 pt-20 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="line-gradient mb-12" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => <MetricCard key={stat.label} stat={stat} />)}
        </div>
        <div className="line-gradient mt-12" />
      </div>
    </section>
  );
}

// ─── 4. HOW IT WORKS ──────────────────────────────────────────────────────────

function HowItWorks() {
  const empresaSteps = [
    { icon: "📦", text: "Cadastre seu produto com preço e comissão" },
    { icon: "🎯", text: "Defina critérios de elegibilidade por nicho e score" },
    { icon: "📣", text: "Receba divulgação de creators qualificados" },
    { icon: "💰", text: "Pague somente pelo resultado gerado" },
  ];
  const influenciadorSteps = [
    { icon: "🛍️", text: "Acesse o Marketplace de produtos disponíveis" },
    { icon: "✅", text: "Escolha produtos alinhados ao seu nicho" },
    { icon: "🔗", text: "Receba seu link exclusivo de afiliado" },
    { icon: "🏆", text: "Divulgue e receba comissão por cada venda" },
  ];

  return (
    <section className="bg-[#0d0d0d] px-6 pt-10 pb-24">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="text-center">
          <Eyebrow>Como funciona</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Simples para todos os lados
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/45">
            Seja empresa ou influenciador, o processo é direto e orientado a resultado.
          </p>
        </FadeUp>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Empresa */}
          <FadeUp delay={0.1}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-400">
                  <IconBuilding />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-500/60">Para empresas e produtores</p>
                  <p className="font-semibold text-white">Anuncie no modelo de performance</p>
                </div>
              </div>
              <div className="space-y-0">
                {empresaSteps.map((step, i) => (
                  <motion.div
                    key={step.text}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-600/[0.08] text-sm font-bold text-red-400">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {i < empresaSteps.length - 1 && (
                        <motion.div
                          className="my-1 w-px flex-1 bg-gradient-to-b from-red-600/20 to-transparent"
                          style={{ minHeight: "28px" }}
                          initial={{ scaleY: 0, originY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                        />
                      )}
                    </div>
                    <div className={`pb-6 pt-1.5 ${i === empresaSteps.length - 1 ? "pb-0" : ""}`}>
                      <span className="text-sm leading-6 text-white/65">{step.text}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Link
                className="btn-shimmer mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-red-600/90 px-5 text-sm font-semibold text-white transition hover:bg-red-600"
                href="/mundo-mapping/afiliados"
              >
                Cadastrar produto →
              </Link>
            </div>
          </FadeUp>

          {/* Influenciador */}
          <FadeUp delay={0.2}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
                  <IconUsers />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Para influenciador</p>
                  <p className="font-semibold text-white">Monetize sua audiência</p>
                </div>
              </div>
              <div className="space-y-0">
                {influenciadorSteps.map((step, i) => (
                  <motion.div
                    key={step.text}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-white/50">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {i < influenciadorSteps.length - 1 && (
                        <motion.div
                          className="my-1 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent"
                          style={{ minHeight: "28px" }}
                          initial={{ scaleY: 0, originY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                        />
                      )}
                    </div>
                    <div className={`pb-6 pt-1.5 ${i === influenciadorSteps.length - 1 ? "pb-0" : ""}`}>
                      <span className="text-sm leading-6 text-white/65">{step.text}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Link
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
                href="/mundo-mapping/influenciadores"
              >
                Acessar área do influenciador →
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── 5. DIFFERENTIALS ─────────────────────────────────────────────────────────

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
      desc: "Validade jurídica sem burocracia. O contrato é gerado e assinado digitalmente no momento do cadastro.",
    },
    {
      icon: <IconZap />,
      title: "Pague por resultado",
      desc: "Comissão somente sobre vendas geradas. Risco zero para a empresa no modelo puro de performance.",
    },
  ];

  return (
    <section className="bg-[#0a0a0a] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="text-center">
          <Eyebrow>Diferenciais</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Por que o Mapping Partners?
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 backdrop-blur-sm transition-colors duration-300 hover:border-red-500/30 hover:bg-white/[0.05]"
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
            >
              {/* Glow on hover */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-600/0 blur-3xl transition-all duration-500 group-hover:bg-red-600/10" />

              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors group-hover:border-red-500/20 group-hover:text-red-400">
                {card.icon}
              </div>
              <h3 className="relative mt-5 text-lg font-semibold text-white">{card.title}</h3>
              <p className="relative mt-3 text-sm leading-7 text-white/50">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 6. FOR WHOM ──────────────────────────────────────────────────────────────

function ForWhom() {
  const empresas = ["E-commerces", "Infoprodutores", "Marcas físicas", "Turismo e hotelaria", "PMEs"];
  const influenciadores = ["Nano e micro creators", "Qualquer nicho", "De qualquer cidade do Brasil", "Com ou sem CNPJ", "Comece sem custo"];

  return (
    <section className="bg-[#0d0d0d] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="text-center">
          <Eyebrow>Para quem é</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Feito para quem quer resultado
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {/* Empresas */}
          <FadeUp delay={0.1}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-red-600/5 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500/60">Empresas e Produtores</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Qualquer negócio que vende online</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Ideal para quem quer escalar vendas com marketing de performance puro.
              </p>
              <ul className="mt-6 space-y-3">
                {empresas.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/65"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-red-400">
                      <IconCheck />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <Link
                className="btn-shimmer mt-8 inline-flex h-10 items-center rounded-xl bg-red-600/90 px-5 text-sm font-semibold text-white transition hover:bg-red-600"
                href="/mundo-mapping/empresa/login"
              >
                Cadastrar →
              </Link>
            </div>
          </FadeUp>

          {/* Influenciadores */}
          <FadeUp delay={0.2}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-white/[0.02] blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Influenciadores</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Creators que querem monetizar</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Sem precisar de milhões de seguidores — audiência engajada já é suficiente.
              </p>
              <ul className="mt-6 space-y-3">
                {influenciadores.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-sm text-white/65"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/50">
                      <IconCheck />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
              <Link
                className="mt-8 inline-flex h-10 items-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
                href="/mundo-mapping/influenciadores"
              >
                Acessar área →
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── 7. TAX MODEL ─────────────────────────────────────────────────────────────

function TaxModel() {
  return (
    <section className="bg-[#0a0a0a] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-red-600/8 blur-3xl" />
            <Eyebrow>Modelo de receita</Eyebrow>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Como funciona a nossa taxa
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-white/50">
              Você só paga quando vende. O Mapping Partners cobra uma taxa adicional sobre as taxas do Asaas — não sobre o valor total da venda. Risco zero para entrar, crescimento compartilhado.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { plan: "Associate", fee: "Asaas + 2%", price: "Grátis", highlight: false },
                { plan: "Partner", fee: "Asaas + R$0,99", price: "R$117/mês", highlight: true },
                { plan: "Elite", fee: "Asaas + R$0,49", price: "R$197/mês", highlight: false },
              ].map((item) => (
                <div
                  key={item.plan}
                  className={`rounded-xl px-4 py-3 text-center text-sm transition ${item.highlight ? "border border-red-500/30 bg-red-600/10 text-red-300" : "border border-white/[0.06] bg-white/[0.03] text-white/50"}`}
                >
                  <p className={`font-bold ${item.highlight ? "text-white" : ""}`}>{item.plan}</p>
                  <p className={`mt-0.5 text-base font-bold ${item.highlight ? "text-white" : "text-white/70"}`}>{item.price}</p>
                  <p className="mt-1 text-xs opacity-70">{item.fee}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── 8. PLANS ─────────────────────────────────────────────────────────────────

type PlanFeature = { text: string; included: boolean };
type Plan = {
  name: string;
  price: string;
  period: string;
  badge: string | null;
  badgeSub: string | null;
  fee: string;
  highlight: boolean;
  cta: string;
  features: PlanFeature[];
};

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const { onMove, onLeave, style } = useTilt();

  return (
    <motion.div
      className={`relative flex flex-col rounded-2xl p-7 ${plan.highlight
        ? "border border-red-500/30 bg-gradient-to-b from-red-950/30 to-[#0a0a0a] shadow-[0_0_80px_rgba(220,38,38,0.12)]"
        : "border border-white/[0.07] bg-white/[0.03]"
      }`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="whitespace-nowrap rounded-full border border-red-500/30 bg-red-600/80 px-4 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {plan.badge}
          </span>
        </div>
      )}

      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlight ? "text-red-400" : "text-white/40"}`}>
          {plan.name}
        </p>
        {plan.badgeSub && (
          <p className="mt-0.5 text-xs text-white/30">{plan.badgeSub}</p>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{plan.price}</span>
        {plan.period && <span className="text-sm text-white/40">{plan.period}</span>}
      </div>

      <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${plan.highlight ? "bg-red-600/10 text-red-400" : "bg-white/[0.04] text-white/40"}`}>
        {plan.fee}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feat) => (
          <li
            key={feat.text}
            className={`flex items-center gap-2.5 text-sm ${feat.included ? "text-white/70" : "text-white/25"}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${feat.included ? (plan.highlight ? "bg-red-400" : "bg-white/40") : "bg-white/15"}`} />
            {feat.text}
          </li>
        ))}
      </ul>

      <Link
        className={`btn-shimmer mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${plan.highlight
          ? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
          : "border border-white/[0.1] bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
        }`}
        href="/mundo-mapping/empresa/login"
      >
        {plan.cta}
      </Link>
    </motion.div>
  );
}

function Plans() {
  const plans: Plan[] = [
    {
      name: "Associate",
      price: "Grátis",
      period: "",
      badge: null,
      badgeSub: "Freemium permanente",
      fee: "Taxa por venda: Asaas + 2%",
      highlight: false,
      cta: "Começar grátis",
      features: [
        { text: "1 produto no marketplace", included: true },
        { text: "Acesso à base de +16k creators", included: true },
        { text: "Link de afiliado básico", included: true },
        { text: "Dashboard de performance", included: false },
        { text: "Ver identidade dos creators", included: false },
      ],
    },
    {
      name: "Partner",
      price: "R$117",
      period: "/mês",
      badge: "Mais popular",
      badgeSub: null,
      fee: "Taxa por venda: Asaas + R$0,99",
      highlight: true,
      cta: "Assinar agora",
      features: [
        { text: "Até 10 produtos no marketplace", included: true },
        { text: "Dashboard de performance completo", included: true },
        { text: "Curadoria automática por nicho", included: true },
        { text: "Vê identidade dos creators afiliados", included: true },
        { text: "Suporte via chat", included: true },
      ],
    },
    {
      name: "Elite",
      price: "R$197",
      period: "/mês",
      badge: null,
      badgeSub: "Máxima performance",
      fee: "Taxa por venda: Asaas + R$0,49",
      highlight: false,
      cta: "Assinar agora",
      features: [
        { text: "Tudo do Partner", included: true },
        { text: "Produtos ilimitados", included: true },
        { text: "Curadoria humana de creators", included: true },
        { text: "Materiais de venda personalizados", included: true },
        { text: "Account manager dedicado", included: true },
        { text: "Relatórios avançados de GMV", included: true },
      ],
    },
  ];

  return (
    <section className="bg-[#0d0d0d] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <FadeUp className="text-center">
          <Eyebrow>Planos</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Entrada gratuita, escala com resultado
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/45">
            Comece sem custo e pague uma taxa sobre as vendas geradas. Planos pagos reduzem a taxa e liberam funcionalidades premium.
          </p>
        </FadeUp>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {plans.map((plan, i) => <PlanCard index={i} key={plan.name} plan={plan} />)}
        </div>

        <FadeUp delay={0.3}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-7 text-white/30">
            As taxas do Mapping Partners são cobradas em cima das taxas padrão do Asaas. Quanto maior o plano, menor a taxa adicional — e maior o seu lucro por venda.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── 9. FINAL CTA ─────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] px-6 py-28">
      {/* Red gradient bg */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(220,38,38,0.18) 0%, transparent 70%)" }} />
      <div className="line-gradient absolute top-0 left-0 right-0" />

      <div className="relative mx-auto max-w-2xl text-center">
        <FadeUp>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Pronto para vender com
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent"> creators reais?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-white/45">
            Cadastre seu produto agora e comece a receber divulgações de influenciadores validados.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              className="btn-shimmer inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-10 text-base font-bold text-white shadow-[0_0_60px_rgba(220,38,38,0.4)] transition hover:bg-red-500"
              href="/mundo-mapping/empresa/login"
            >
              Começar agora
            </Link>
            <Link
              className="text-sm font-medium text-white/40 underline-offset-4 transition hover:text-white hover:underline"
              href="/mundo-mapping/influenciador/login"
            >
              Já sou influenciador da Mundo Mapping
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── 10. FOOTER ───────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <MappingPartnersLogo onDark size="sm" subtitle="Uma sub-marca da Mundo Mapping" />
        <div className="flex items-center gap-6 text-xs text-white/25">
          <Link className="transition hover:text-white/60" href="/mundo-mapping/empresa/login">Entrar</Link>
          <Link className="transition hover:text-white/60" href="/mundo-mapping/afiliados">Cadastrar produto</Link>
          <Link className="transition hover:text-white/60" href="/mundo-mapping/influenciadores">Influenciadores</Link>
        </div>
        <p className="text-xs text-white/20">© {new Date().getFullYear()} Mapping Partners</p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MappingPartnersPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <main>
          <Hero />
          <Metrics />
          <HowItWorks />
          <Differentials />
          <ForWhom />
          <TaxModel />
          <Plans />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
