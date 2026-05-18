"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Cupom = {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  limit_usos: number | null;
  usos_realizados: number;
  validade: string | null;
  ativo: boolean;
  criado_em: string;
};

type LimiteMode = "unico" | "limitado" | "ilimitado";

function gerarCodigoAleatorio(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function StatusBadge({ cupom }: { cupom: Cupom }) {
  const expirado = cupom.validade && new Date(cupom.validade) < new Date();
  const esgotado = cupom.limit_usos !== null && cupom.usos_realizados >= cupom.limit_usos;
  if (!cupom.ativo) return <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">Inativo</span>;
  if (expirado) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Expirado</span>;
  if (esgotado) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Esgotado</span>;
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ativo</span>;
}

export function CuponsTab({ productId, empresaId }: { productId: string; empresaId: string }) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Form state
  const [codigo, setCodigo] = useState("");
  const [valor, setValor] = useState("");
  const [limiteMode, setLimiteMode] = useState<LimiteMode>("ilimitado");
  const [limiteN, setLimiteN] = useState("5");
  const [validade, setValidade] = useState("");

  async function loadCupons() {
    const supabase = createClient();
    const { data } = await supabase
      .from("cupons")
      .select("id, codigo, tipo, valor, limit_usos, usos_realizados, validade, ativo, criado_em")
      .eq("produto_id", productId)
      .order("criado_em", { ascending: false });
    setCupons(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadCupons(); }, [productId]);

  function showFeedback(tipo: "ok" | "erro", texto: string) {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const codigoFinal = codigo.trim().toUpperCase();
    if (!codigoFinal) return showFeedback("erro", "Informe o código do cupom.");
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0 || valorNum > 100) return showFeedback("erro", "Informe um percentual válido (1–100).");

    const limitUsos =
      limiteMode === "unico" ? 1
      : limiteMode === "limitado" ? parseInt(limiteN, 10) || null
      : null;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("cupons").insert({
      produto_id: productId,
      empresa_id: empresaId,
      codigo: codigoFinal,
      tipo: "percentual",
      valor: valorNum,
      limit_usos: limitUsos,
      validade: validade ? new Date(validade).toISOString() : null,
    });
    setSaving(false);

    if (error) {
      if (error.code === "23505") return showFeedback("erro", "Já existe um cupom com este código para este produto.");
      return showFeedback("erro", "Erro ao criar cupom.");
    }

    showFeedback("ok", `Cupom ${codigoFinal} criado com sucesso.`);
    setCodigo("");
    setValor("");
    setLimiteMode("ilimitado");
    setLimiteN("5");
    setValidade("");
    loadCupons();
  }

  async function toggleAtivo(cupom: Cupom) {
    const supabase = createClient();
    await supabase.from("cupons").update({ ativo: !cupom.ativo }).eq("id", cupom.id);
    loadCupons();
  }

  async function handleDelete(id: string, codigoCupom: string) {
    if (!confirm(`Excluir o cupom "${codigoCupom}"? Esta ação não pode ser desfeita.`)) return;
    const supabase = createClient();
    await supabase.from("cupons").delete().eq("id", id);
    loadCupons();
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${feedback.tipo === "ok" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.texto}
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-zinc-200">
        <div className="border-b border-zinc-100 px-5 py-4">
          <p className="text-sm font-semibold text-zinc-900">Cupons do produto</p>
          <p className="mt-0.5 text-xs text-zinc-500">{cupons.length} cupom{cupons.length !== 1 ? "s" : ""} cadastrado{cupons.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2].map((i) => <div className="h-12 animate-pulse rounded-xl bg-zinc-100" key={i} />)}
          </div>
        ) : cupons.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">Nenhum cupom cadastrado ainda.</p>
            <p className="mt-1 text-xs text-zinc-400">Crie um cupom no formulário abaixo.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {cupons.map((cupom) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" key={cupom.id}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-zinc-800">
                    {cupom.codigo}
                  </span>
                  <StatusBadge cupom={cupom} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">{cupom.valor}% off</span>
                  <span>
                    {cupom.usos_realizados}/{cupom.limit_usos === null ? "∞" : cupom.limit_usos} usos
                  </span>
                  <span>Validade: {fmtDate(cupom.validade)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                    onClick={() => toggleAtivo(cupom)}
                    type="button"
                  >
                    {cupom.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    onClick={() => handleDelete(cupom.id, cupom.codigo)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-zinc-200">
        <div className="border-b border-zinc-100 px-5 py-4">
          <p className="text-sm font-semibold text-zinc-900">Criar novo cupom</p>
        </div>
        <form className="space-y-5 p-5" onSubmit={handleCreate}>
          {/* Code */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Código do cupom</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-zinc-800 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                maxLength={20}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EX: PROMO20"
                value={codigo}
              />
              <button
                className="shrink-0 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                onClick={() => setCodigo(gerarCodigoAleatorio())}
                type="button"
              >
                Gerar
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tipo — only percentual for now */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Tipo</label>
              <div className="flex h-10 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700">
                Percentual (%)
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Desconto (%)</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  inputMode="decimal"
                  max={100}
                  min={1}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="20"
                  step="0.01"
                  type="number"
                  value={valor}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">%</span>
              </div>
            </div>
          </div>

          {/* Limite de usos */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-zinc-600">Limite de usos</label>
            <div className="flex flex-wrap gap-2">
              {(["unico", "limitado", "ilimitado"] as LimiteMode[]).map((m) => (
                <button
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${limiteMode === m ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
                  key={m}
                  onClick={() => setLimiteMode(m)}
                  type="button"
                >
                  {m === "unico" ? "Uso único" : m === "limitado" ? "Limitado" : "Ilimitado"}
                </button>
              ))}
              {limiteMode === "limitado" && (
                <input
                  className="w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
                  inputMode="numeric"
                  min={2}
                  onChange={(e) => setLimiteN(e.target.value)}
                  placeholder="10"
                  type="number"
                  value={limiteN}
                />
              )}
            </div>
          </div>

          {/* Validade */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-600">
              Data de validade <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setValidade(e.target.value)}
              type="date"
              value={validade}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60 shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Criando...
                </>
              ) : "Criar cupom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
