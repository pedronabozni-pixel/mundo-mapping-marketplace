export function InfluenciadorPlanBanner() {
  return (
    <div
      className="px-6 py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(74,222,128,0.04)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
          style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}
        >
          ✓
        </span>
        <span className="text-sm" style={{ color: "#888" }}>
          <span className="font-semibold text-white">Plataforma gratuita para creators</span>
          {" — "}Você não paga nada para usar o Mapping Partners. Sua receita vem 100% das comissões geradas pelas suas vendas.
        </span>
      </div>
    </div>
  );
}
