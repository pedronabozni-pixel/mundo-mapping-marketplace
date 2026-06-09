"use client";

import { useState } from "react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    />
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

export function AdminCard({
  label,
  value,
  sub,
  emphasis,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={
        emphasis
          ? {
              background:
                "linear-gradient(135deg, rgba(200,16,46,0.08), rgba(200,16,46,0.02), transparent)",
              borderColor: "rgba(200,16,46,0.15)",
            }
          : {
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }
      }
    >
      {loading ? (
        <>
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </>
      ) : (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#888" }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "#fff" }}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs" style={{ color: "#555" }}>{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

export function AdminSection({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex items-start justify-between gap-4 border-b px-6 py-4"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#fff" }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: "#555" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs" style={{ color: "#888" }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </p>
      <div className="flex gap-1.5">
        <button
          className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white disabled:opacity-30"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          type="button"
        >
          Anterior
        </button>
        <button
          className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white disabled:opacity-30"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          type="button"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-base font-semibold" style={{ color: "#fff" }}>{title}</h3>
        <p className="mt-2 text-sm leading-6" style={{ color: "#888" }}>{message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#aaa] transition hover:text-white"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              danger
                ? "bg-[#C8102E] hover:bg-[#A30D24]"
                : "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)]"
            }`}
            onClick={onConfirm}
            type="button"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badges ────────────────────────────────────────────────────────────

export function AdminBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const styles: Record<string, { background: string; color: string }> = {
    success: { background: "rgba(74,222,128,0.12)", color: "#4ADE80" },
    warning: { background: "rgba(251,191,36,0.12)", color: "#FBBF24" },
    danger: { background: "rgba(200,16,46,0.12)", color: "#C8102E" },
    info: { background: "rgba(200,16,46,0.1)", color: "#C8102E" },
    neutral: { background: "rgba(255,255,255,0.06)", color: "#888" },
  };

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={styles[tone]}
    >
      {label}
    </span>
  );
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

export function PlanBadge({ plano }: { plano: string | null }) {
  if (!plano) return <AdminBadge label="—" />;
  // associate (neutral), partner (vermelho sutil), elite (dourado sutil)
  const tones: Record<string, "neutral" | "info" | "warning"> = {
    associate: "neutral",
    partner: "info",
    elite: "warning",
  };
  return (
    <AdminBadge
      label={plano.charAt(0).toUpperCase() + plano.slice(1)}
      tone={tones[plano] ?? "neutral"}
    />
  );
}

// ─── Plan select modal ────────────────────────────────────────────────────────

export function PlanModal({
  currentPlan,
  onSave,
  onCancel,
}: {
  currentPlan: string | null;
  onSave: (plan: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(currentPlan ?? "associate");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-xs rounded-2xl border p-6"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-base font-semibold" style={{ color: "#fff" }}>Editar plano</h3>
        <div className="mt-4 space-y-2">
          {["associate", "partner", "elite"].map((plan) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition"
              key={plan}
              style={
                selected === plan
                  ? { background: "rgba(200,16,46,0.12)", borderColor: "rgba(200,16,46,0.5)" }
                  : { borderColor: "rgba(255,255,255,0.08)" }
              }
            >
              <input
                checked={selected === plan}
                className="accent-[#C8102E]"
                onChange={() => setSelected(plan)}
                type="radio"
              />
              <span className="text-sm font-medium capitalize" style={{ color: "#aaa" }}>{plan}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#aaa] transition hover:text-white"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-xl bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#A30D24]"
            onClick={() => onSave(selected)}
            type="button"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Note form ────────────────────────────────────────────────────────────────

export function NoteForm({
  onAdd,
  loading,
}: {
  onAdd: (text: string) => void;
  loading?: boolean;
}) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input
        className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#C8102E]"
        onChange={(e) => setText(e.target.value)}
        placeholder="Adicionar anotação interna…"
        value={text}
      />
      <button
        className="rounded-xl bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50"
        disabled={loading || !text.trim()}
        type="submit"
      >
        {loading ? "…" : "Adicionar"}
      </button>
    </form>
  );
}
