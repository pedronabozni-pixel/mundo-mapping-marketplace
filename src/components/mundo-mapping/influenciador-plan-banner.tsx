export function InfluenciadorPlanBanner() {
  return (
    <div className="border-b border-zinc-200/80 bg-white px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">✓</span>
        <span className="text-sm text-zinc-600">
          <span className="font-semibold text-zinc-800">Plataforma gratuita para creators</span>
          {" — "}Você não paga nada para usar o Mapping Partners. Sua receita vem 100% das comissões geradas pelas suas vendas.
        </span>
      </div>
    </div>
  );
}
