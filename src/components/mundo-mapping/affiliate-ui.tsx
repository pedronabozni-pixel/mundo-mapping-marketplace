import Link from "next/link";
import { ReactNode } from "react";

export type NavLink = {
  href: string;
  label: string;
};

export const affiliateNavLinks: NavLink[] = [
  { href: "/mundo-mapping/afiliados", label: "Dashboard" },
  { href: "/mundo-mapping/afiliados/produtos/novo", label: "Novo produto" },
  { href: "/mundo-mapping/afiliados/produtos/mapa-360-pro", label: "Hub do produto" },
  { href: "/mundo-mapping/afiliados/shopping", label: "Shopping" },
  { href: "/mundo-mapping/afiliados/financeiro", label: "Financeiro" },
  { href: "/mundo-mapping/afiliados/admin", label: "Admin" }
];

export const topProducts = [
  { name: "Mentoria Comercial MM", revenue: "R$ 182.400", affiliates: 82, conversion: "6,8%" },
  { name: "Mapa 360 Pro", revenue: "R$ 96.320", affiliates: 54, conversion: "4,9%" },
  { name: "O Que as Marcas Querem", revenue: "R$ 31.740", affiliates: 121, conversion: "8,4%" }
];

export const topAffiliates = [
  { name: "Ana Martinelli", channel: "@anamartinellii", gmv: "R$ 28.900", conversion: "7,2%" },
  { name: "Jaine Chagas", channel: "@byjainechagas", gmv: "R$ 21.440", conversion: "6,1%" },
  { name: "Yuri Aguiar", channel: "@yurizaoaguiar", gmv: "R$ 18.160", conversion: "5,4%" }
];

export const salesRows = [
  ["Mentoria Comercial MM", "12 mar 2026", "R$ 1.290", "Ana Martinelli", "Cartão", "Pendente"],
  ["Mapa 360 Pro", "12 mar 2026", "R$ 890", "Jaine Chagas", "PIX", "Disponível"],
  ["O Que as Marcas Querem", "11 mar 2026", "R$ 19,90", "Yuri Aguiar", "Cartão", "Pago"],
  ["Mapa 360 Pro", "10 mar 2026", "R$ 890", "Mell Correia", "PIX", "Em análise"]
];

export const affiliateRequests = [
  { name: "Natalia Alves", niche: "Negócios locais", audience: "67 mil", fit: "Alto" },
  { name: "Lucas Souza", niche: "B2B e vendas", audience: "41 mil", fit: "Médio" },
  { name: "Kamilla Andrade", niche: "Empreendedorismo", audience: "93 mil", fit: "Alto" }
];

export const financeRows = [
  ["12 mar 2026", "Venda confirmada", "Mentoria Comercial MM", "+R$ 312,00", "Disponível"],
  ["11 mar 2026", "Comissão em janela", "Mapa 360 Pro", "+R$ 178,00", "Pendente"],
  ["09 mar 2026", "Saque processado", "Conta principal", "-R$ 4.800,00", "Pago"],
  ["08 mar 2026", "Chargeback", "Mapa 360 Pro", "-R$ 890,00", "Revertido"]
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function StatusBadge({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "red";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : tone === "danger"
          ? "bg-zinc-900 text-white ring-zinc-800"
          : tone === "red"
            ? "bg-red-50 text-red-700 ring-red-200"
            : "bg-zinc-100 text-zinc-700 ring-zinc-200";

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", toneClass)}>{label}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200/80 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{eyebrow}</p>
        <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function PeriodSwitch({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1">
      {options.map((item) => (
        <button
          className={cn("rounded-full px-3 py-2 text-sm transition", value === item ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}
          key={item}
          onClick={() => onChange(item)}
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
  className
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
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
  emphasis = false
}: {
  label: string;
  value: string;
  meta: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-[0_18px_60px_-45px_rgba(24,24,27,0.28)]",
        emphasis ? "border-red-200 bg-gradient-to-br from-red-50 via-white to-white" : "border-zinc-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className={cn("mt-3 text-3xl font-semibold tracking-tight", emphasis ? "text-red-700" : "text-zinc-950")}>{value}</p>
        </div>
        <div className={cn("h-11 w-11 rounded-2xl", emphasis ? "bg-red-600/10" : "bg-zinc-100")} />
      </div>
      <p className="mt-4 text-sm text-zinc-500">{meta}</p>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "red" | "green";
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-[11px] font-medium uppercase leading-4 tracking-[0.12em] text-zinc-400 break-words">{label}</p>
      <p
        className={cn(
          "mt-2 break-words text-xl font-semibold leading-tight",
          tone === "red" ? "text-red-700" : tone === "green" ? "text-emerald-700" : "text-zinc-950"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-zinc-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-left">
          <thead className="bg-zinc-50">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.map((row, rowIndex) => (
              <tr className="hover:bg-zinc-50" key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-4 text-sm text-zinc-700" key={`${cell}-${cellIndex}`}>
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
  values = [42, 48, 64, 60, 78, 92, 88, 106, 114, 128, 123, 140],
  labels = ["abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez", "jan", "fev", "mar"]
}: {
  values?: number[];
  labels?: string[];
}) {
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
    <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="relative h-64 overflow-hidden rounded-[18px] bg-white">
        <div className="absolute inset-0 grid grid-rows-4">
          {[0, 1, 2, 3].map((row) => (
            <div className="border-b border-zinc-100 last:border-b-0" key={row} />
          ))}
        </div>
        <svg className="relative h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="mm-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline fill="none" points={points} stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          <polygon fill="url(#mm-line-fill)" points={`0,${height} ${points} ${width},${height}`} />
          {values.map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range) * (height - 32) - 16;
            return <circle cx={x} cy={y} fill="#ffffff" key={`${value}-${index}`} r="5.5" stroke="#dc2626" strokeWidth="3" />;
          })}
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs text-zinc-500">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function Funnel() {
  const steps = [
    { label: "Cliques", value: "48.320", width: "100%" },
    { label: "Checkout iniciado", value: "12.108", width: "82%" },
    { label: "Pagamento aprovado", value: "4.192", width: "64%" },
    { label: "Comissao elegivel", value: "3.740", width: "50%" }
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700">{step.label}</span>
            <span className="text-zinc-500">{step.value}</span>
          </div>
          <div className="h-11 rounded-2xl bg-zinc-100 p-1">
            <div
              className={cn(
                "flex h-full items-center rounded-xl px-4 text-sm font-semibold text-white",
                index === 0 ? "bg-zinc-900" : index === 1 ? "bg-red-700" : index === 2 ? "bg-red-500" : "bg-red-300 text-red-950"
              )}
              style={{ width: step.width }}
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
  status
}: {
  title: string;
  price: string;
  commission: string;
  status: string;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_50px_-44px_rgba(24,24,27,0.24)] transition hover:border-zinc-300">
      <div className="relative h-28 border-b border-zinc-100 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_100%)] p-4">
        <div className="absolute right-4 top-4">
          <StatusBadge label={status} tone={status === "Público" ? "success" : "warning"} />
        </div>
        <div className="max-w-[160px] rounded-[16px] border border-zinc-200 bg-white p-3">
          <div className="h-10 rounded-xl bg-red-50" />
          <div className="mt-3 h-2.5 w-20 rounded-full bg-zinc-200" />
          <div className="mt-2 h-2.5 w-12 rounded-full bg-zinc-100" />
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h4 className="text-base font-semibold text-zinc-950">{title}</h4>
          <p className="mt-1 text-sm text-zinc-500">Produto com checkout, criativos e regras centralizadas.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Preço" value={price} />
          <MiniStat label="Comissão" tone="red" value={commission} />
        </div>
        <p className="text-sm font-semibold text-zinc-700">Abrir produto</p>
      </div>
    </article>
  );
}

export function BlueprintBlock({
  index,
  title,
  items
}: {
  index: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_20px_70px_-55px_rgba(24,24,27,0.3)]">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-sm font-semibold text-red-700">{index}</div>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AffiliateShell({
  children,
  currentPath
}: {
  children: ReactNode;
  currentPath: string;
}) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 text-zinc-900 md:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] gap-4 xl:grid-cols-[210px_1fr]">
        <aside className="flex h-full flex-col rounded-[24px] bg-[#181a20] p-3 text-white shadow-[0_34px_80px_-62px_rgba(0,0,0,0.78)]">
          <div className="rounded-[18px] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Mundo Mapping</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight">Afiliados</h1>
            <p className="mt-1 text-sm text-white/55">Produtos e operação.</p>
          </div>

          <nav className="mt-4 space-y-1.5">
            {affiliateNavLinks.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  className={cn(
                    "block rounded-[14px] px-3.5 py-3 text-left transition",
                    isActive
                      ? "bg-red-600 text-white shadow-[0_18px_40px_-28px_rgba(220,38,38,0.85)]"
                      : "text-white/72 hover:bg-white/[0.05] hover:text-white"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold">Modelo do módulo</p>
            <p className="mt-2 text-sm leading-6 text-white/58">
              A empresa cadastra o produto. O influenciador afiliado recebe o próprio link para vender.
            </p>
          </div>
        </aside>

        <div className="overflow-hidden rounded-[28px] border border-white/70 bg-[#fcfcfd] shadow-[0_40px_120px_-80px_rgba(15,23,42,0.38)]">
          {children}
        </div>
      </div>
    </div>
  );
}

const influencerNavLinks = [
  { href: "/mundo-mapping/influenciadores", label: "Painel" },
  { href: "/mundo-mapping/influenciadores/marketplace", label: "Marketplace" },
  { href: "/mundo-mapping/influenciadores/links", label: "Meus links" },
  { href: "/mundo-mapping/influenciadores/produtos", label: "Produtos" },
  { href: "/mundo-mapping/influenciadores/materiais", label: "Materiais" },
  { href: "/mundo-mapping/influenciadores/financeiro", label: "Financeiro" }
];

export function InfluencerShell({
  children,
  currentPath
}: {
  children: ReactNode;
  currentPath: string;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7f7_0%,#f6f7fb_24%,#f4f5f7_100%)] p-4 text-zinc-900 md:p-5">
      <div className="mx-auto max-w-[1480px] overflow-hidden rounded-[28px] border border-white/70 bg-[#fcfcfd] shadow-[0_40px_120px_-80px_rgba(15,23,42,0.38)]">
        <header className="border-b border-zinc-200/80 bg-white/90 px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Mundo Mapping Partners</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Área do influenciador</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Um ambiente próprio para operar links, produtos afiliados, comissão e materiais.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" href="/mundo-mapping/influenciadores/financeiro">
                Solicitar saque
              </Link>
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {influencerNavLinks.map((item) => (
              <Link
                className={cn(
                  "inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition",
                  currentPath === item.href
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
