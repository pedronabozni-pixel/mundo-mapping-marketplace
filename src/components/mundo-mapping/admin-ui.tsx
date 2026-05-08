"use client";

import { useState } from "react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800 ${className}`} />;
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
      className={`rounded-2xl border p-5 ${
        emphasis
          ? "border-red-900/60 bg-red-950/40"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      {loading ? (
        <>
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-7 w-20" />
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${emphasis ? "text-red-400" : "text-white"}`}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-zinc-600">{sub}</p>}
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
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
      <p className="text-xs text-zinc-500">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </p>
      <div className="flex gap-1.5">
        <button
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          type="button"
        >
          Anterior
        </button>
        <button
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:text-zinc-200"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              danger
                ? "bg-red-700 hover:bg-red-600"
                : "bg-zinc-700 hover:bg-zinc-600"
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
  const colors = {
    success: "bg-emerald-950 text-emerald-400 ring-emerald-900",
    warning: "bg-amber-950 text-amber-400 ring-amber-900",
    danger: "bg-red-950 text-red-400 ring-red-900",
    info: "bg-blue-950 text-blue-400 ring-blue-900",
    neutral: "bg-zinc-800 text-zinc-400 ring-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${colors[tone]}`}
    >
      {label}
    </span>
  );
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

export function PlanBadge({ plano }: { plano: string | null }) {
  if (!plano) return <AdminBadge label="—" />;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-xs rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white">Editar plano</h3>
        <div className="mt-4 space-y-2">
          {["associate", "partner", "elite"].map((plan) => (
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                selected === plan
                  ? "border-red-700 bg-red-950/40"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
              key={plan}
            >
              <input
                checked={selected === plan}
                className="accent-red-600"
                onChange={() => setSelected(plan)}
                type="radio"
              />
              <span className="text-sm font-medium capitalize text-zinc-300">{plan}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:text-zinc-200"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
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
        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600"
        onChange={(e) => setText(e.target.value)}
        placeholder="Adicionar anotação interna…"
        value={text}
      />
      <button
        className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600 disabled:opacity-50"
        disabled={loading || !text.trim()}
        type="submit"
      >
        {loading ? "…" : "Adicionar"}
      </button>
    </form>
  );
}
