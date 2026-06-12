"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";

export type NavLink = {
  href: string;
  label: string;
};

export const affiliateNavLinks: NavLink[] = [
  { href: "/mundo-mapping/afiliados", label: "Dashboard" },
  { href: "/mundo-mapping/afiliados/produtos/novo", label: "Novo produto" },
  { href: "/mundo-mapping/afiliados/produtos", label: "Meus produtos" },
  { href: "/mundo-mapping/afiliados/solicitacoes", label: "Solicitações" },
  { href: "/mundo-mapping/afiliados/creators", label: "Creators" },
  { href: "/mundo-mapping/afiliados/descobrir", label: "Encontrar creators" },
  { href: "/mundo-mapping/afiliados/financeiro", label: "Financeiro" },
  { href: "/mundo-mapping/afiliados/relatorio", label: "Relatório" },
  { href: "/mundo-mapping/afiliados/perfil", label: "Perfil" },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <rect height="7" rx="1.5" width="7" x="3" y="3" />
      <rect height="7" rx="1.5" width="7" x="14" y="3" />
      <rect height="7" rx="1.5" width="7" x="3" y="14" />
      <rect height="7" rx="1.5" width="7" x="14" y="14" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" x2="12" y1="22.08" y2="12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconUserSearch() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h5" />
      <circle cx="17" cy="16" r="3.5" />
      <path d="m22 21-2.5-2.5" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect height="4" rx="1" width="6" x="9" y="3" />
      <line x1="9" x2="15" y1="12" y2="12" />
      <line x1="9" x2="11" y1="16" y2="16" />
    </svg>
  );
}
function IconDollar() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <line x1="12" x2="12" y1="1" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const sidebarItems: Array<{ href: string; label: string; Icon: () => ReactNode }> = [
  { href: "/mundo-mapping/afiliados", label: "Dashboard", Icon: IconGrid },
  { href: "/mundo-mapping/afiliados/produtos", label: "Produtos", Icon: IconBox },
  { href: "/mundo-mapping/afiliados/creators", label: "Creators", Icon: IconUsers },
  { href: "/mundo-mapping/afiliados/descobrir", label: "Encontrar creators", Icon: IconUserSearch },
  { href: "/mundo-mapping/afiliados/solicitacoes", label: "Solicitações", Icon: IconClipboard },
  { href: "/mundo-mapping/afiliados/financeiro", label: "Financeiro", Icon: IconDollar },
  { href: "/mundo-mapping/afiliados/relatorio", label: "Relatórios", Icon: IconBarChart },
];

function isNavActive(currentPath: string, href: string): boolean {
  if (href === "/mundo-mapping/afiliados") return currentPath === href;
  return currentPath === href || currentPath.startsWith(href + "/");
}

function SidebarLogo() {
  return (
    <Image
      src="/brand/logo-mapping-partners-icone.png"
      alt="Mapping Partners"
      width={36}
      height={36}
      className="shrink-0"
    />
  );
}

function NavItem({
  href,
  label,
  Icon,
  currentPath,
  showLabel,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: () => ReactNode;
  currentPath: string;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  const active = isNavActive(currentPath, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={label}
      className={cn(
        "relative flex items-center rounded-lg transition-colors",
        showLabel ? "gap-3 px-3 w-full" : "justify-center",
        active ? "text-white" : "text-[#666] hover:text-white"
      )}
      style={{
        height: 40,
        width: showLabel ? "auto" : 40,
        background: active ? "rgba(200,16,46,0.12)" : "transparent",
      }}
    >
      {active && (
        <span
          className="absolute"
          style={{
            left: 0,
            top: 8,
            bottom: 8,
            width: 2,
            background: "#C8102E",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <Icon />
      {showLabel && <span className="text-[13px] font-medium">{label}</span>}
    </Link>
  );
}

// ─── Exported UI components (dark mode) ───────────────────────────────────────

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "red";
}) {
  const styles: Record<string, { background: string; color: string; border?: string }> = {
    success: { background: "rgba(74,222,128,0.12)", color: "#4ADE80" },
    warning: { background: "rgba(251,191,36,0.12)", color: "#FBBF24" },
    danger:  { background: "#0a0a0a", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" },
    red:     { background: "rgba(200,16,46,0.12)", color: "#C8102E" },
    neutral: { background: "rgba(255,255,255,0.04)", color: "#888" },
  };
  const s = styles[tone] ?? styles.neutral;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.background, color: s.color, border: s.border }}
    >
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#555" }}>{eyebrow}</p>
        <h2 className="mt-2 font-sans text-[26px] font-extrabold tracking-[-0.02em] text-white">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "#888" }}>{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function PeriodSwitch({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg p-[3px]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {options.map((item) => (
        <button
          className={cn(
            "rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            value === item ? "text-white" : "hover:text-[#aaa]"
          )}
          key={item}
          onClick={() => onChange(item)}
          style={value === item ? { background: "rgba(255,255,255,0.06)", color: "#fff" } : { color: "#666" }}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl p-6", className)}
      style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-sans text-lg font-bold tracking-[-0.01em] text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm" style={{ color: "#666" }}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  meta,
  emphasis = false,
}: {
  label: string;
  value: string;
  meta: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={
        emphasis
          ? { background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.15)" }
          : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      <p
        className="text-[11px] font-medium uppercase tracking-[0.04em]"
        style={{ color: "#888" }}
      >
        {label}
      </p>
      <p
        className="mt-3 font-sans text-[32px] font-extrabold tracking-[-0.02em] leading-none text-white"
      >
        {value}
      </p>
      <p className="mt-4 text-[11px]" style={{ color: "#666" }}>{meta}</p>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "red" | "green";
}) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <p className="text-[10px] font-medium uppercase leading-4 tracking-[0.12em] break-words" style={{ color: "#555" }}>
        {label}
      </p>
      <p
        className="mt-2 break-words text-xl font-semibold leading-tight"
        style={{ color: tone === "red" ? "#C8102E" : tone === "green" ? "#4ADE80" : "#fff" }}
      >
        {value}
      </p>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y text-left" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <thead style={{ background: "rgba(255,255,255,0.03)" }}>
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
                  key={column}
                  style={{ color: "#555" }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {rows.map((row, rowIndex) => (
              <tr
                className="transition-colors hover:bg-white/[0.02]"
                key={`${row[0]}-${rowIndex}`}
              >
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-4 text-sm" key={`${cell}-${cellIndex}`} style={{ color: "#aaa" }}>
                    {cellIndex === row.length - 1 ? (
                      <StatusBadge
                        label={cell}
                        tone={
                          cell === "Disponível" || cell === "Pago" || cell === "Publicado"
                            ? "success"
                            : cell === "Pendente" || cell === "Em análise"
                              ? "warning"
                              : cell === "Revertido"
                                ? "red"
                                : "neutral"
                        }
                      />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LineChart({
  values = [],
  labels = [],
}: {
  values?: number[];
  labels?: string[];
}) {
  if (!values.length) {
    return (
      <div
        className="flex h-52 items-center justify-center rounded-[20px]"
        style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm" style={{ color: "#555" }}>Nenhum dado disponível ainda.</p>
      </div>
    );
  }

  const width = 960;
  const height = 260;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 32) - 16;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className="rounded-[20px] p-4"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="relative h-64 overflow-hidden rounded-[18px]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="absolute inset-0 grid grid-rows-4">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="last:border-b-0" />
          ))}
        </div>
        <svg className="relative h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="mm-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C8102E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#C8102E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline fill="none" points={points} stroke="#C8102E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          <polygon fill="url(#mm-line-fill)" points={`0,${height} ${points} ${width},${height}`} />
          {values.map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range) * (height - 32) - 16;
            return (
              <circle cx={x} cy={y} fill="#0a0a0a" key={`${value}-${index}`} r="5.5" stroke="#C8102E" strokeWidth="3" />
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs" style={{ color: "#555" }}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

type FunnelStep = { label: string; value: string; width: string };

export function Funnel({ steps = [] }: { steps?: FunnelStep[] }) {
  if (!steps.length) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-[20px]"
        style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm" style={{ color: "#555" }}>Nenhum dado de funil disponível.</p>
      </div>
    );
  }

  const barColors = [
    { bg: "rgba(255,255,255,0.1)", text: "#fff" },
    { bg: "#C8102E", text: "#fff" },
    { bg: "rgba(200,16,46,0.6)", text: "#fff" },
    { bg: "rgba(200,16,46,0.3)", text: "#C8102E" },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-white">{step.label}</span>
            <span style={{ color: "#888" }}>{step.value}</span>
          </div>
          <div className="h-11 rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div
              className="flex h-full items-center rounded-xl px-4 text-sm font-semibold"
              style={{
                width: step.width,
                background: barColors[index % barColors.length].bg,
                color: barColors[index % barColors.length].text,
              }}
            >
              {step.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductVisualCard({
  title,
  price,
  commission,
  status,
}: {
  title: string;
  price: string;
  commission: string;
  status: string;
}) {
  return (
    <article
      className="overflow-hidden rounded-[20px] transition-colors"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="relative border-b"
        style={{
          height: 120,
          background: "linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)",
          borderColor: "rgba(200,16,46,0.1)",
        }}
      >
        <div className="absolute right-4 top-4">
          <StatusBadge label={status} tone={status === "Público" ? "success" : "warning"} />
        </div>
        <div
          className="absolute bottom-4 left-4 rounded-[6px]"
          style={{ width: 32, height: 32, background: "rgba(200,16,46,0.2)" }}
        />
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h4 className="text-base font-semibold text-white">{title}</h4>
          <p className="mt-1 text-sm" style={{ color: "#555" }}>Produto com checkout, criativos e regras centralizadas.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Preço" value={price} />
          <MiniStat label="Comissão" tone="red" value={commission} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "#888" }}>Abrir produto</p>
      </div>
    </article>
  );
}

export function BlueprintBlock({
  index,
  title,
  items,
}: {
  index: string;
  title: string;
  items: string[];
}) {
  return (
    <div
      className="rounded-[24px] p-6"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold"
          style={{ background: "rgba(200,16,46,0.12)", color: "#C8102E" }}
        >
          {index}
        </div>
        <h3 className="font-sans text-lg font-bold tracking-[-0.01em] text-white">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: "#888" }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── AffiliateShell ───────────────────────────────────────────────────────────

export function AffiliateShell({
  children,
  currentPath,
}: {
  children: ReactNode;
  currentPath: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* ── Mobile top bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 xl:hidden"
        style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <SidebarLogo />
          <span className="font-sans font-bold text-white" style={{ fontSize: 15 }}>Afiliados</span>
        </div>
        <button
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
          onClick={() => setMenuOpen(true)}
          style={{ color: "#888" }}
          type="button"
        >
          <IconMenu />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 flex h-full flex-col gap-1 p-4 text-white"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 220, background: "#060606", borderRight: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="mb-3 flex items-center justify-between px-1 py-2">
              <SidebarLogo />
              <button
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
                style={{ color: "#666" }}
                type="button"
              >
                <IconClose />
              </button>
            </div>
            {sidebarItems.map((item) => (
              <NavItem
                Icon={item.Icon}
                currentPath={currentPath}
                href={item.href}
                key={item.href}
                label={item.label}
                onNavigate={() => setMenuOpen(false)}
                showLabel
              />
            ))}
            <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <NavItem
                Icon={IconUser}
                currentPath={currentPath}
                href="/mundo-mapping/afiliados/perfil"
                label="Perfil"
                onNavigate={() => setMenuOpen(false)}
                showLabel
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Fixed desktop sidebar ── */}
      <aside
        className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:flex-col xl:items-center xl:pb-4 xl:pt-5"
        style={{ width: 64, background: "#060606", borderRight: "1px solid rgba(255,255,255,0.04)", zIndex: 40 }}
      >
        <SidebarLogo />

        <div className="mt-7 flex w-full flex-col items-center gap-1 px-3">
          {sidebarItems.map((item) => (
            <NavItem
              Icon={item.Icon}
              currentPath={currentPath}
              href={item.href}
              key={item.href}
              label={item.label}
            />
          ))}
        </div>

        <div className="mt-auto">
          <Link
            href="/mundo-mapping/afiliados/perfil"
            title="Perfil"
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#666",
            }}
          >
            <IconUser />
          </Link>
        </div>
      </aside>

      {/* ── Content (offset for fixed sidebar on xl) ── */}
      <div className="xl:pl-16">
        {children}
      </div>
    </div>
  );
}

// ─── InfluencerShell icons ───────────────────────────────────────────────────

function IconShoppingBag() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const influencerSidebarItems: Array<{ href: string; label: string; Icon: () => ReactNode }> = [
  { href: "/mundo-mapping/influenciadores", label: "Painel", Icon: IconGrid },
  { href: "/mundo-mapping/influenciadores/shopping", label: "Shopping", Icon: IconShoppingBag },
  { href: "/mundo-mapping/influenciadores/meus-links", label: "Meus links", Icon: IconLink },
  { href: "/mundo-mapping/influenciadores/financeiro", label: "Financeiro", Icon: IconDollar },
];

// ─── InfluencerShell (sidebar minimal, dark) ─────────────────────────────────

export function InfluencerShell({
  children,
  currentPath,
}: {
  children: ReactNode;
  currentPath: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* ── Mobile top bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 xl:hidden"
        style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <SidebarLogo />
          <span className="font-sans font-bold text-white" style={{ fontSize: 15 }}>Influenciadores</span>
        </div>
        <button
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
          onClick={() => setMenuOpen(true)}
          style={{ color: "#888" }}
          type="button"
        >
          <IconMenu />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 flex h-full flex-col gap-1 p-4 text-white"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 220, background: "#060606", borderRight: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="mb-3 flex items-center justify-between px-1 py-2">
              <SidebarLogo />
              <button
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
                style={{ color: "#666" }}
                type="button"
              >
                <IconClose />
              </button>
            </div>
            {influencerSidebarItems.map((item) => (
              <NavItem
                Icon={item.Icon}
                currentPath={currentPath}
                href={item.href}
                key={item.href}
                label={item.label}
                onNavigate={() => setMenuOpen(false)}
                showLabel
              />
            ))}
            <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <NavItem
                Icon={IconUser}
                currentPath={currentPath}
                href="/mundo-mapping/influenciadores/perfil"
                label="Perfil"
                onNavigate={() => setMenuOpen(false)}
                showLabel
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Fixed desktop sidebar ── */}
      <aside
        className="hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:flex-col xl:items-center xl:pb-4 xl:pt-5"
        style={{ width: 64, background: "#060606", borderRight: "1px solid rgba(255,255,255,0.04)", zIndex: 40 }}
      >
        <SidebarLogo />

        <div className="mt-7 flex w-full flex-col items-center gap-1 px-3">
          {influencerSidebarItems.map((item) => (
            <NavItem
              Icon={item.Icon}
              currentPath={currentPath}
              href={item.href}
              key={item.href}
              label={item.label}
            />
          ))}
        </div>

        <div className="mt-auto">
          <Link
            href="/mundo-mapping/influenciadores/perfil"
            title="Perfil"
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#666",
            }}
          >
            <IconUser />
          </Link>
        </div>
      </aside>

      {/* ── Content (offset for fixed sidebar on xl) ── */}
      <div className="xl:pl-16">
        {children}
      </div>
    </div>
  );
}
