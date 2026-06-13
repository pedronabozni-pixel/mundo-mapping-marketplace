"use client";

import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

// ════════════════════════════════════════════════════════════════════════════
//  Tokens & helpers
// ════════════════════════════════════════════════════════════════════════════

const ease = [0.22, 1, 0.36, 1] as const;
const COPYRIGHT_YEAR = 2026;

const globalStyles = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .mp-marquee, .mp-blob, .mp-float, .mp-float-slow, .mp-pulse-dot, .mp-glow-pulse { animation: none !important; }
  }
  .mp-root {
    font-family: var(--font-inter), Inter, system-ui, -apple-system, sans-serif;
    font-feature-settings: "ss01", "cv11";
    --mp-accent: #ef0f1a;
    --mp-accent-soft: #b80009;
  }
  .mp-mono { font-family: var(--font-dm-mono), ui-monospace, SFMono-Regular, Menlo, monospace; }

  @keyframes mp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .mp-marquee { animation: mp-marquee 40s linear infinite; }

  @keyframes mp-blob {
    0%, 100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(60px,-40px) scale(1.05); }
    66% { transform: translate(-40px,30px) scale(0.97); }
  }
  .mp-blob { animation: mp-blob 18s ease-in-out infinite; }

  /* Hero phone + floating cards */
  @keyframes mp-float {
    0%, 100% { transform: translateY(-10px); }
    50% { transform: translateY(10px); }
  }
  .mp-float { animation: mp-float 5s ease-in-out infinite; }
  @keyframes mp-float-slow {
    0%, 100% { transform: translateY(8px) translateX(-4px); }
    50% { transform: translateY(-8px) translateX(4px); }
  }
  .mp-float-slow { animation: mp-float-slow 6.5s ease-in-out infinite; }

  /* Pulsing live dot */
  @keyframes mp-pulse-dot {
    0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
    70% { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
    100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
  }
  .mp-pulse-dot { animation: mp-pulse-dot 2s ease-out infinite; }

  /* Pulsing glow (final CTA) */
  @keyframes mp-glow-pulse {
    0%, 100% { opacity: 0.18; transform: translate(-50%,-50%) scale(1); }
    50% { opacity: 0.32; transform: translate(-50%,-50%) scale(1.08); }
  }
  .mp-glow-pulse { animation: mp-glow-pulse 5s ease-in-out infinite; }

  .mp-noise {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
  }

  .mp-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 80px 80px;
  }

  .mp-hero-h1 {
    font-weight: 800;
    letter-spacing: -0.045em;
    line-height: 0.92;
  }
  @media (max-width: 640px) {
    .mp-hero-h1 { letter-spacing: -0.03em; line-height: 0.95; }
  }

  .mp-display {
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.95;
  }

  /* Magnetic button glow */
  .mp-magnet { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
  .mp-magnet:hover { transform: translate3d(0, -2px, 0); }

  /* Cursor */
  .mp-cursor-hidden, .mp-cursor-hidden * { cursor: none !important; }
  @media (hover: none) { .mp-cursor-hidden, .mp-cursor-hidden * { cursor: auto !important; } }
`;

// ════════════════════════════════════════════════════════════════════════════
//  Reusable animation primitives
// ════════════════════════════════════════════════════════════════════════════

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 32,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function SplitWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.07,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + i * stagger, ease }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Counter({
  value,
  format = (n: number) => n.toLocaleString("pt-BR"),
  duration = 2.4,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return <span ref={ref}>{format(count)}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
//  Custom cursor (desktop only, hover-capable devices)
// ════════════════════════════════════════════════════════════════════════════

function CustomCursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 400, damping: 30, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 400, damping: 30, mass: 0.4 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;
    setEnabled(true);
    document.documentElement.classList.add("mp-cursor-hidden");

    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      const target = e.target as HTMLElement | null;
      setHover(!!target?.closest("a, button, [data-hover]"));
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove("mp-cursor-hidden");
    };
  }, [mx, my]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      >
        <motion.div
          className="rounded-full bg-white"
          animate={{ width: hover ? 56 : 10, height: hover ? 56 : 10, opacity: hover ? 0.9 : 1 }}
          transition={{ duration: 0.25, ease }}
        />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100]"
        style={{ x: mx, y: my, translateX: "-50%", translateY: "-50%" }}
      >
        <div className="h-1 w-1 rounded-full bg-white" />
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Magnetic button (hover-driven micro-displacement)
// ════════════════════════════════════════════════════════════════════════════

function Magnetic({ children, strength = 18 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set(((e.clientX - cx) / rect.width) * strength);
        y.set(((e.clientY - cy) / rect.height) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Icons (inline SVG, lucide-style)
// ════════════════════════════════════════════════════════════════════════════

const Icon = {
  Arrow: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Instagram: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  ),
  TikTok: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.8v2.4c-1.3.1-2.5-.3-3.6-1v5.4c0 3.4-2.6 5.4-5.4 5.4A5 5 0 0 1 6 14a5 5 0 0 1 6-4.9v2.6a2.4 2.4 0 0 0-2.7 2.3 2.3 2.3 0 0 0 4.6.2V3h2.6z" />
    </svg>
  ),
  YouTube: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 6.4a2.8 2.8 0 0 0-1.9-2C18.9 4 12 4 12 4s-6.9 0-8.6.4a2.8 2.8 0 0 0-1.9 2A29 29 0 0 0 1.2 12a29 29 0 0 0 .3 5.6 2.8 2.8 0 0 0 1.9 2C5.1 20 12 20 12 20s6.9 0 8.6-.4a2.8 2.8 0 0 0 1.9-2 29 29 0 0 0 .3-5.6 29 29 0 0 0-.3-5.6z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98" fill="currentColor" />
    </svg>
  ),
  XSocial: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Heart: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21z" />
    </svg>
  ),
  Play: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20" /></svg>
  ),
  Wallet: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" /><path d="M17 12h.01" />
    </svg>
  ),
  Trending: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  Sparkle: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  ),
  Star: ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 9 22 9.3 16.5 13.8 18.5 21 12 16.8 5.5 21 7.5 13.8 2 9.3 9 9" /></svg>
  ),
};

// ════════════════════════════════════════════════════════════════════════════
//  1. NAVBAR
// ════════════════════════════════════════════════════════════════════════════

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#manifesto", label: "Manifesto" },
    { href: "#funciona", label: "Como funciona" },
    { href: "#planos", label: "Planos" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(8,8,8,0.7)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/mundo-mapping/partners" data-hover aria-label="Mapping Partners, voltar para o topo">
          <MappingPartnersLogo onDark size="md" subtitle="Mapping Partners" />
        </Link>

        <nav className="mp-mono hidden items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-white/55 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="px-4 py-2 transition hover:text-white" data-hover>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/mundo-mapping/empresa/login"
            data-hover
            className="mp-mono text-[11px] uppercase tracking-[0.18em] text-white/55 transition hover:text-white"
          >
            Entrar
          </Link>
          <Magnetic strength={10}>
            <Link
              href="/mundo-mapping/empresa/login"
              data-hover
              className="mp-magnet group inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-semibold tracking-tight text-black transition hover:bg-white/90"
            >
              Começar agora
              <span className="transition-transform group-hover:translate-x-0.5"><Icon.Arrow /></span>
            </Link>
          </Magnetic>
        </div>

        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          type="button"
          aria-label="Menu"
        >
          <span className={`block h-px w-6 bg-white transition-transform ${mobileOpen ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block h-px w-6 bg-white transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-px w-6 bg-white transition-transform ${mobileOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06] bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-5">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="mp-mono py-3 text-[11px] uppercase tracking-[0.2em] text-white/70 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <Link href="/mundo-mapping/empresa/login" className="mp-mono py-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
                Entrar
              </Link>
              <Link
                href="/mundo-mapping/empresa/login"
                className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black"
              >
                Começar agora
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  2. HERO
// ════════════════════════════════════════════════════════════════════════════

// ── Hero: phone mockup ────────────────────────────────────────────────────────

function PhoneMockup({ reduce }: { reduce: boolean }) {
  const posts = [
    { red: true, icon: <Icon.Play size={14} /> },
    { red: false, icon: <Icon.Heart size={14} /> },
    { red: true, icon: <Icon.Sparkle size={14} /> },
    { red: false, icon: <Icon.Play size={14} /> },
    { red: true, icon: <Icon.Heart size={14} /> },
    { red: false, icon: <Icon.Instagram size={14} /> },
  ];

  return (
    <div className="relative" style={{ width: 232 }}>
      {/* Glow under the phone */}
      <div
        className="pointer-events-none absolute -inset-10 -z-10 blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 60%, rgba(239,15,26,0.28) 0%, transparent 65%)" }}
      />

      <div className={reduce ? "" : "mp-float"}>
        <div
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#0c0c0c] p-2.5 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]"
          style={{ aspectRatio: "9 / 19" }}
        >
          {/* Notch */}
          <div className="absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-[#0a0a0a]">
            {/* Cover */}
            <div className="relative h-24 shrink-0" style={{ background: "linear-gradient(135deg, #ef0f1a 0%, #6b0007 55%, #1a0203 100%)" }}>
              <div className="absolute inset-0 mp-noise opacity-20 mix-blend-overlay" />
            </div>

            {/* Avatar + handle */}
            <div className="-mt-8 flex flex-col items-center px-4">
              <div
                className="h-16 w-16 rounded-full border-[3px] border-[#0a0a0a]"
                style={{ background: "conic-gradient(from 140deg, #ef0f1a, #ff7a45, #ef0f1a)" }}
              />
              <p className="mt-2 text-[13px] font-semibold text-white">@creator.solar</p>
              <p className="mp-mono text-[8px] uppercase tracking-[0.18em] text-white/40">Lifestyle · Beleza</p>
            </div>

            {/* Stats */}
            <div className="mt-3 flex items-center justify-center gap-5 px-4">
              <div className="text-center">
                <p className="text-[14px] font-bold text-white">284k</p>
                <p className="mp-mono text-[7px] uppercase tracking-[0.16em] text-white/40">Seguidores</p>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[14px] font-bold" style={{ color: "#4ADE80" }}>8.4%</p>
                <p className="mp-mono text-[7px] uppercase tracking-[0.16em] text-white/40">Engajamento</p>
              </div>
            </div>

            {/* Posts grid */}
            <div className="mt-4 grid flex-1 grid-cols-3 gap-1 px-2 pb-2">
              {posts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-[6px]"
                  style={{
                    background: p.red
                      ? "linear-gradient(135deg, rgba(239,15,26,0.35), rgba(107,0,7,0.25))"
                      : "rgba(255,255,255,0.05)",
                    color: p.red ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {p.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  className,
  delay,
  drift,
  children,
}: {
  className: string;
  delay: number;
  drift: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`absolute z-20 ${className}`}
    >
      <div className={drift ? "mp-float-slow" : "mp-float"}>
        <div
          className="rounded-2xl border border-white/10 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          style={{ background: "rgba(20,20,20,0.9)" }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const avatars = [
    "conic-gradient(from 120deg, #ef0f1a, #ff7a45)",
    "linear-gradient(135deg, #6b0007, #ef0f1a)",
    "linear-gradient(135deg, #1f6feb, #6b3df0)",
    "linear-gradient(135deg, #f0a93d, #ef0f1a)",
  ];

  return (
    <section ref={ref} className="relative isolate min-h-[100svh] overflow-hidden bg-[#080808]">
      {/* Background layers */}
      <motion.div suppressHydrationWarning style={{ y: yBg }} className="absolute inset-0 -z-10">
        <div className="mp-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div
          className="absolute inset-x-0 top-0 h-[600px]"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,16,46,0.12) 0%, transparent 60%)" }}
        />
        <div
          className="mp-blob absolute -right-40 top-0 h-[700px] w-[700px] rounded-full opacity-[0.18]"
          style={{ background: "radial-gradient(circle, var(--mp-accent) 0%, transparent 70%)" }}
        />
        <div
          className="mp-blob absolute -left-40 bottom-20 h-[600px] w-[600px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #6b0007 0%, transparent 70%)", animationDelay: "-6s" }}
        />
        <div className="mp-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />
      </motion.div>

      <motion.div
        suppressHydrationWarning
        style={{ opacity }}
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1400px] items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-10 lg:pb-0"
      >
        {/* ── LEFT: copy ── */}
        <div>
          {/* Headline */}
          <h1 className="mp-hero-h1 mt-7 text-white text-[40px] sm:text-[52px] lg:text-[60px] xl:text-[68px]">
            <span className="block"><SplitWords text="A melhor rede de" delay={0.1} /></span>
            <span className="block overflow-hidden align-bottom">
              <motion.span
                className="inline-block italic text-[var(--mp-accent)]"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, delay: 0.35, ease }}
              >
                creators
              </motion.span>
            </span>
            <span className="block"><SplitWords text="do Brasil." delay={0.5} /></span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-7 max-w-md text-[15px] leading-[1.7] text-white/55 md:text-[16px]"
          >
            16.000 creators validados. +100 nichos. 1.950 cidades.
            A plataforma de afiliados de performance da Mundo Mapping.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <Link
                href="/mundo-mapping/empresa/login"
                data-hover
                className="mp-magnet group inline-flex h-14 items-center gap-3 rounded-full bg-[var(--mp-accent)] px-7 text-[15px] font-semibold tracking-tight text-white shadow-[0_30px_60px_-20px_rgba(239,15,26,0.45)] transition hover:bg-[#ff2e3a]"
              >
                Começar agora
                <span className="transition-transform group-hover:translate-x-1"><Icon.Arrow /></span>
              </Link>
            </Magnetic>
            <a
              href="#funciona"
              data-hover
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 text-[14px] font-semibold tracking-tight text-white transition hover:border-white/30 hover:bg-white/[0.07]"
            >
              Ver como funciona
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className="mt-10 flex items-center gap-4"
          >
            <div className="flex -space-x-2.5">
              {avatars.map((bg, i) => (
                <span key={i} className="h-9 w-9 rounded-full border-2 border-[#080808]" style={{ background: bg }} />
              ))}
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#080808] bg-white/10 text-[10px] font-bold text-white">
                +16k
              </span>
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-[#f0a93d]">
                {[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} size={12} />)}
              </div>
              <p className="mt-0.5 text-[12px] text-white/50">creators já faturando</p>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: phone mockup + floating cards (desktop only) ── */}
        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative">
            <PhoneMockup reduce={reduce} />

            {/* Instagram card - top left */}
            <FloatingCard className="-left-16 top-8" delay={1.2} drift={false}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #f0a93d, #ef0f1a 45%, #c13584 75%, #6b3df0)" }}
                >
                  <Icon.Instagram size={18} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">+1.240</p>
                  <p className="text-[10px] text-white/50">novos seguidores</p>
                </div>
              </div>
            </FloatingCard>

            {/* TikTok card - right */}
            <FloatingCard className="-right-20 top-1/2" delay={1.45} drift>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                  <Icon.TikTok size={18} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">128k views</p>
                  <p className="text-[10px] text-white/50">no TikTok</p>
                </div>
              </div>
            </FloatingCard>

            {/* Commission card - bottom right */}
            <FloatingCard className="-right-10 bottom-6" delay={1.7} drift={false}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(74,222,128,0.14)", color: "#4ADE80" }}
                >
                  <Icon.Wallet size={18} />
                </span>
                <div>
                  <p className="mp-mono text-[8px] uppercase tracking-[0.16em] text-white/45">Comissão hoje</p>
                  <p className="mp-display text-[20px] leading-none" style={{ color: "#4ADE80" }}>+R$ 847</p>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        suppressHydrationWarning
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/40"
          >
            <Icon.ArrowDown />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  3. MARQUEE (números rolando)
// ════════════════════════════════════════════════════════════════════════════

function Marquee() {
  const items = [
    "16.000+ creators validados",
    "+100 nichos",
    "1.950 cidades",
    "R$ 8M+ em vendas",
    "+650 marcas ativas",
  ];
  const doubled = [...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#080808] py-7">
      <div className="mp-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="mp-display text-[40px] text-white/70 sm:text-[56px]">{item}</span>
            <span className="text-[var(--mp-accent)]" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  3b. CREATORS MARQUEE (rede ativa - handles rolando)
// ════════════════════════════════════════════════════════════════════════════

function CreatorsMarquee() {
  const creators = [
    { handle: "@creator.solar", metric: "284k", net: "ig" },
    { handle: "@lara.fit", metric: "1.2M", net: "tk" },
    { handle: "@joao.tech", metric: "512k", net: "yt" },
    { handle: "@bia.makeup", metric: "847k", net: "ig" },
    { handle: "@pedro.invest", metric: "326k", net: "x" },
    { handle: "@duda.viagens", metric: "1.8M", net: "tk" },
    { handle: "@rafa.games", metric: "934k", net: "yt" },
    { handle: "@manu.style", metric: "623k", net: "ig" },
  ];
  const avatarBgs = [
    "conic-gradient(from 120deg, #ef0f1a, #ff7a45)",
    "linear-gradient(135deg, #1f6feb, #6b3df0)",
    "linear-gradient(135deg, #f0a93d, #ef0f1a)",
    "linear-gradient(135deg, #6b0007, #ef0f1a)",
  ];
  const netIcon = (net: string, size = 13) =>
    net === "ig" ? <Icon.Instagram size={size} /> :
    net === "tk" ? <Icon.TikTok size={size} /> :
    net === "yt" ? <Icon.YouTube size={size} /> :
    <Icon.XSocial size={size} />;

  const doubled = [...creators, ...creators];

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#0a0a0a] py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      <div className="mp-marquee flex w-max items-center gap-4 whitespace-nowrap">
        {doubled.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-white/[0.02] py-2 pl-2 pr-5"
          >
            <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: avatarBgs[i % avatarBgs.length] }} />
            <span className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-white/85">{c.handle}</span>
              <span className="text-white/25" style={{ color: "var(--mp-accent)" }}>{netIcon(c.net)}</span>
              <span className="mp-mono text-[11px] text-white/45">{c.metric}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  4. MANIFESTO
// ════════════════════════════════════════════════════════════════════════════

function Manifesto() {
  return (
    <section id="manifesto" className="relative bg-[#080808] px-6 py-32 lg:px-10 lg:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
            (01) Manifesto
          </span>
          <p className="mp-mono mt-8 max-w-xs text-[13px] leading-[1.7] text-white/45">
            Construímos a infraestrutura para a próxima geração de marketing de performance brasileira.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <h2 className="mp-display text-white text-[44px] sm:text-[64px] md:text-[84px]">
            Built for{" "}
            <span className="italic font-light text-white/40">performance.</span>
            <br />
            Designed for{" "}
            <span className="text-[var(--mp-accent)]">trust.</span>
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <p className="text-[15px] leading-[1.8] text-white/60">
              A Mapping Partners não é mais uma plataforma de creators. É a infraestrutura por trás dos
              afiliados das maiores marcas do Brasil: curadoria humana, validação técnica e wallet
              financeira automática.
            </p>
            <p className="text-[15px] leading-[1.8] text-white/60">
              Cada creator passa por uma análise rigorosa de audiência, engajamento e adequação ao nicho.
              Quem entra, vende.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  5. MÉTRICAS
// ════════════════════════════════════════════════════════════════════════════

function Metricas() {
  const stats = [
    { value: 16000, prefix: "+", suffix: "", label: "Creators validados", format: (n: number) => n.toLocaleString("pt-BR") },
    { value: 100, prefix: "+", suffix: "", label: "Nichos cobertos", format: (n: number) => String(n) },
    { value: 1950, prefix: "", suffix: "", label: "Cidades atendidas", format: (n: number) => n.toLocaleString("pt-BR") },
    { value: 8, prefix: "R$", suffix: "M+", label: "Em vendas geradas", format: (n: number) => String(n) },
  ];

  return (
    <section className="relative bg-[#0a0a0a] px-6 py-28 lg:px-10 lg:py-36">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex items-end justify-between gap-8">
            <div>
              <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
                (02) Números
              </span>
              <h2 className="mp-display mt-6 text-white text-[36px] sm:text-[52px] md:text-[64px]">
                Escala que comprova.
              </h2>
            </div>
            <p className="mp-mono hidden max-w-[200px] text-right text-[11px] leading-[1.7] text-white/40 md:block">
              Dados atualizados em<br/>Mai/2026
            </p>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[2px] border border-white/[0.06] bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease }}
              className="group relative flex flex-col justify-between gap-10 overflow-visible bg-[#0a0a0a] p-8 transition-colors hover:bg-[#0e0e0e] lg:p-10"
            >
              <span className="mp-mono text-[11px] uppercase tracking-[0.22em] text-white/35 group-hover:text-[var(--mp-accent)] transition-colors">
                0{i + 1}
              </span>
              <div>
                <p className="mp-display whitespace-nowrap text-white text-[40px] tabular-nums sm:text-[48px] md:text-[52px] lg:text-[56px] xl:text-[64px]">
                  {stat.prefix}<Counter value={stat.value} format={stat.format} />{stat.suffix}
                </p>
                <p className="mt-3 text-[14px] text-white/45">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  6. COMO FUNCIONA (assimétrico, alternando lados)
// ════════════════════════════════════════════════════════════════════════════

function ComoFunciona() {
  const steps = [
    {
      n: "01",
      kicker: "Empresa",
      title: "Cadastre seu produto",
      desc: "Defina preço, comissão e nichos elegíveis. Aprovação técnica em até 24h.",
      icon: <Icon.Plus />,
    },
    {
      n: "02",
      kicker: "Curadoria",
      title: "Receba creators validados",
      desc: "Quem aparece no seu dashboard tem audiência real, engajamento real e nicho compatível.",
      icon: <Icon.Sparkle size={14} />,
    },
    {
      n: "03",
      kicker: "Performance",
      title: "Acompanhe em tempo real",
      desc: "Vendas, cliques, comissões e ROI por creator. Dashboard ao vivo, sem planilha.",
      icon: <Icon.Trending size={14} />,
    },
    {
      n: "04",
      kicker: "Pagamento",
      title: "Wallet financeira automática",
      desc: "Comissão cai direto na conta do creator no momento da venda. Risco zero, sem mensalidade obrigatória.",
      icon: <Icon.Wallet size={14} />,
    },
  ];

  return (
    <section id="funciona" className="relative bg-[#080808] px-6 py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
            (03) Como funciona
          </span>
          <h2 className="mp-display mt-6 max-w-3xl text-white text-[44px] sm:text-[64px] md:text-[80px]">
            Quatro passos.<br/>
            <span className="text-white/30">Zero atrito.</span>
          </h2>
        </Reveal>

        <div className="mt-24 space-y-24 lg:space-y-32">
          {steps.map((step, i) => {
            const reverse = i % 2 === 1;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.9, ease }}
                className={`grid items-center gap-10 lg:gap-20 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                {/* Visual block */}
                <div className="relative">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-[2px] border border-white/[0.06] bg-gradient-to-br from-[#141414] via-[#0c0c0c] to-[#080808]">
                    <div className="mp-grid absolute inset-0 opacity-40" />
                    <div
                      className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
                      style={{ background: `radial-gradient(circle, ${reverse ? "#3a0103" : "var(--mp-accent)"} 0%, transparent 70%)` }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-between p-10">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mp-accent)]/30 text-[var(--mp-accent)]"
                          style={{ background: "rgba(239,15,26,0.08)" }}
                        >
                          {step.icon}
                        </span>
                        <span className="mp-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
                          {step.kicker}
                        </span>
                      </div>
                      <p className="mp-display text-[88px] leading-none text-white/95 sm:text-[120px] md:text-[160px] lg:text-[220px]" aria-hidden="true">
                        {step.n}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Text block */}
                <div>
                  <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
                    Step {step.n}
                  </span>
                  <h3 className="mp-display mt-4 text-white text-[32px] sm:text-[44px] md:text-[56px]">
                    {step.title}
                  </h3>
                  <p className="mt-6 max-w-md text-[16px] leading-[1.8] text-white/55">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  7. PARA EMPRESAS / PARA CREATORS (duas colunas, hover assimétrico)
// ════════════════════════════════════════════════════════════════════════════

function DuasFrentes() {
  const blocks = [
    {
      tag: "Para empresas",
      title: "Anuncie por performance.",
      desc: "Pague só pelo resultado. Sem cachê fixo, sem risco. Comissão automática sobre cada venda gerada por creators validados do seu nicho.",
      bullets: ["E-commerces e infoprodutores", "Curadoria humana", "Dashboard de ROI por creator", "Plano grátis disponível"],
      cta: { label: "Cadastrar produto", href: "/mundo-mapping/empresa/login" },
      accent: true,
    },
    {
      tag: "Para creators",
      title: "Monetize sua audiência.",
      desc: "Escolha produtos alinhados ao seu nicho, gere link de afiliado e receba comissão na sua wallet financeira automaticamente, sem precisar de CNPJ.",
      bullets: ["Marketplace de +650 marcas", "Wallet financeira criada na hora", "Comissão direta na conta", "Comece sem custo"],
      cta: { label: "Sou creator", href: "/mundo-mapping/influenciador/login" },
      accent: false,
    },
  ];

  return (
    <section className="bg-[#0a0a0a] px-6 py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
            (04) Duas frentes
          </span>
          <h2 className="mp-display mt-6 max-w-3xl text-white text-[44px] sm:text-[64px] md:text-[80px]">
            Marcas <span className="text-white/30">&</span> creators<br/>
            no mesmo lugar.
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[2px] border border-white/[0.06] bg-white/[0.06] md:grid-cols-2">
          {blocks.map((b) => (
            <Reveal key={b.tag} delay={0.1}>
              <div
                className={`relative flex h-full flex-col justify-between gap-12 p-10 transition-colors lg:p-14 ${
                  b.accent
                    ? "bg-[#0a0a0a] hover:bg-[#120606]"
                    : "bg-[#0a0a0a] hover:bg-[#0f0f0f]"
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle, ${b.accent ? "var(--mp-accent)" : "#444"} 0%, transparent 70%)` }}
                />
                <div>
                  <span className={`mp-mono text-[10px] uppercase tracking-[0.25em] ${b.accent ? "text-[var(--mp-accent)]" : "text-white/40"}`}>
                    {b.tag}
                  </span>
                  <h3 className="mp-display mt-5 text-white text-[36px] sm:text-[48px] md:text-[56px]">
                    {b.title}
                  </h3>
                  <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-white/55">
                    {b.desc}
                  </p>
                </div>

                <div>
                  <ul className="space-y-3 border-t border-white/[0.06] pt-8">
                    {b.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-3 text-[14px] text-white/65">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${b.accent ? "bg-[var(--mp-accent)]/15 text-[var(--mp-accent)]" : "bg-white/[0.06] text-white/45"}`}>
                          <Icon.Check />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={b.cta.href}
                    data-hover
                    className={`mt-10 inline-flex h-12 items-center gap-3 rounded-full px-6 text-[14px] font-semibold tracking-tight transition ${
                      b.accent
                        ? "bg-[var(--mp-accent)] text-white shadow-[0_24px_50px_-20px_rgba(239,15,26,0.5)] hover:bg-[#ff2e3a]"
                        : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.08]"
                    }`}
                  >
                    {b.cta.label}
                    <Icon.Arrow />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  8. PLANOS
// ════════════════════════════════════════════════════════════════════════════

function Planos() {
  const plans = [
    {
      name: "Associate",
      price: "Grátis",
      period: "",
      sub: "Comece sem custo",
      fee: "2% por venda",
      features: ["1 produto no marketplace", "Link de afiliado básico"],
      cta: "Começar grátis",
      href: "/mundo-mapping/empresa/login",
      highlight: false,
    },
    {
      name: "Partner",
      price: "R$ 117",
      period: "/mês",
      sub: "Mais popular",
      fee: "R$ 0,99 por venda",
      features: [
        "Até 10 produtos",
        "Acesso à base de +16k creators",
        "Dashboard de performance",
        "Curadoria automática por nicho",
        "Identidade dos creators",
        "Suporte via chat",
      ],
      cta: "Assinar Partner",
      href: "/assinar/partner",
      highlight: true,
    },
    {
      name: "Elite",
      price: "R$ 197",
      period: "/mês",
      sub: "Máxima performance",
      fee: "R$ 0,49 por venda",
      features: [
        "Tudo do Partner",
        "Até 50 produtos",
        "Curadoria humana",
        "Materiais personalizados",
        "Account manager dedicado",
      ],
      cta: "Assinar Elite",
      href: "/assinar/elite",
      highlight: false,
    },
  ];

  return (
    <section id="planos" className="bg-[#080808] px-6 py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
                (05) Planos
              </span>
              <h2 className="mp-display mt-6 text-white text-[44px] sm:text-[64px] md:text-[80px]">
                Entrada grátis.<br/>
                <span className="text-white/30">Escala com resultado.</span>
              </h2>
            </div>
            <p className="mp-mono max-w-xs text-[13px] leading-[1.7] text-white/45">
              Quanto maior o plano, menor a taxa por venda, maior o seu lucro.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[2px] border border-white/[0.06] bg-white/[0.06] lg:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
              whileHover={{ y: -6 }}
              className={`group relative flex flex-col gap-10 p-10 transition-colors lg:p-12 ${
                p.highlight
                  ? "z-10 bg-gradient-to-b from-[#160506] to-[#0a0a0a] hover:from-[#1c0608]"
                  : "bg-[#0a0a0a] hover:bg-[#0e0e0e]"
              }`}
              style={
                p.highlight
                  ? { boxShadow: "inset 0 0 0 1px rgba(239,15,26,0.45), 0 40px 80px -40px rgba(239,15,26,0.4)" }
                  : undefined
              }
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${p.highlight ? "rgba(239,15,26,0.5)" : "rgba(255,255,255,0.12)"} 0%, transparent 70%)` }}
              />
              {p.highlight && (
                <span className="mp-mono absolute right-6 top-6 z-10 rounded-full border border-[var(--mp-accent)]/40 bg-[var(--mp-accent)]/10 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-[var(--mp-accent)]">
                  Mais popular
                </span>
              )}

              <div>
                <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                  {p.name}
                </span>
                <p className="mt-2 text-[11px] text-white/35">{p.sub}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="mp-display text-white text-[56px] sm:text-[72px]">{p.price}</span>
                  {p.period && <span className="text-[15px] text-white/40">{p.period}</span>}
                </div>
                <p className={`mp-mono mt-3 text-[11px] uppercase tracking-[0.2em] ${p.highlight ? "text-[var(--mp-accent)]" : "text-white/40"}`}>
                  {p.fee}
                </p>
              </div>

              <ul className="space-y-3 border-t border-white/[0.06] pt-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-white/65">
                    <span className={`h-1 w-1 rounded-full ${p.highlight ? "bg-[var(--mp-accent)]" : "bg-white/40"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                data-hover
                className={`mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold transition ${
                  p.highlight
                    ? "bg-[var(--mp-accent)] text-white shadow-[0_24px_50px_-20px_rgba(239,15,26,0.5)] hover:bg-[#ff2e3a]"
                    : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30"
                }`}
              >
                {p.cta}
                <Icon.Arrow />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  9. CTA FINAL (massivo)
// ════════════════════════════════════════════════════════════════════════════

function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yText = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-[#080808] px-8 py-40 lg:px-12 lg:py-56">
      <div className="absolute inset-0 -z-10">
        <div className="mp-grid absolute inset-0 opacity-40" />
        <div
          className="mp-glow-pulse absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, var(--mp-accent) 0%, transparent 65%)" }}
        />
        <div className="mp-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      </div>

      <motion.div
        suppressHydrationWarning
        style={{ y: yText }}
        className="relative mx-auto w-full max-w-[1100px] px-8 pb-6 text-center"
      >
        <Reveal>
          <span className="mp-mono text-[10px] uppercase tracking-[0.25em] text-[var(--mp-accent)]">
            (06) Junte-se
          </span>
        </Reveal>
        <h2 className="mx-auto mt-8 font-extrabold tracking-tight text-white text-[56px] sm:text-[80px] md:text-[112px] lg:text-[144px] xl:text-[168px]">
          <span className="block leading-[1.2]">
            <SplitWords text="Comece" delay={0.05} />
          </span>
          <span className="block italic font-light leading-[1.2] text-white/40 pr-[0.3em]">
            <SplitWords text="agora." delay={0.25} />
          </span>
        </h2>

        <Reveal delay={0.3} className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <Magnetic>
            <Link
              href="/mundo-mapping/empresa/login"
              data-hover
              className="mp-magnet group inline-flex h-16 items-center gap-3 rounded-full bg-white px-10 text-[16px] font-semibold tracking-tight text-black transition hover:bg-white/90"
            >
              Cadastrar meu produto
              <span className="transition-transform group-hover:translate-x-1"><Icon.Arrow /></span>
            </Link>
          </Magnetic>
          <Link
            href="/mundo-mapping/influenciador/login"
            data-hover
            className="mp-mono text-[12px] uppercase tracking-[0.25em] text-white/50 transition hover:text-white"
          >
            Entrar como creator →
          </Link>
        </Reveal>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  10. FOOTER (minimalista)
// ════════════════════════════════════════════════════════════════════════════

function Footer() {
  const links = [
    { label: "Empresa", href: "/mundo-mapping/empresa/login" },
    { label: "Creator", href: "/mundo-mapping/influenciador/login" },
    { label: "Mundo Mapping", href: "https://mundomapping.com" },
    { label: "Termos", href: "/mundo-mapping/termos" },
    { label: "Privacidade", href: "/mundo-mapping/privacidade" },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-[#060606] px-6 py-12 lg:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-[1.2fr_1fr_auto] md:items-start">
        <div>
          <MappingPartnersLogo onDark size="sm" subtitle="Do ecossistema da Mundo Mapping" />
          <p className="mp-mono mt-5 max-w-xs text-[11px] leading-[1.8] text-white/35">
            partners@mundomapping.com<br/>
            São Paulo · Brasil
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              data-hover
              className="mp-mono text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="mp-mono text-[10px] uppercase tracking-[0.25em] text-white/25">
          © {COPYRIGHT_YEAR} Mapping Partners
        </p>
      </div>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function MappingPartnersPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <div className="mp-root min-h-screen bg-[#080808] text-white selection:bg-[var(--mp-accent)] selection:text-white">
        <CustomCursor />
        <Navbar />
        <main>
          <Hero />
          <Marquee />
          <Manifesto />
          <Metricas />
          <CreatorsMarquee />
          <ComoFunciona />
          <DuasFrentes />
          <Planos />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
