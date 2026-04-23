import Link from "next/link";
import type { Ingredient, RecipeMatch } from "@/types/kitchen";

interface RecipeCardProps {
  match: RecipeMatch;
  ingredientMap: Map<string, Ingredient>;
  selectedIds: string[];
}

export function RecipeCard({ match, ingredientMap, selectedIds }: RecipeCardProps) {
  const available = [...match.matchedRequiredIds, ...match.matchedOptionalIds]
    .map((id) => ingredientMap.get(id)?.name)
    .filter(Boolean)
    .slice(0, 5);

  const missing = match.missingRequiredIds.map((id) => ingredientMap.get(id)?.name).filter(Boolean);

  return (
    <article className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_25px_70px_-40px_rgba(15,23,42,0.35)]">
      <div className="aspect-[16/11] overflow-hidden">
        <img src={match.recipe.image} alt={match.recipe.name} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              {match.label}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{match.recipe.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{match.recipe.description}</p>
          </div>
          <div className="rounded-[22px] bg-slate-900 px-4 py-3 text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Match</p>
            <p className="text-2xl font-semibold">{match.compatibility}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tempo</p>
            <p className="mt-1 font-semibold text-slate-900">{match.recipe.prepMinutes} min</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dificuldade</p>
            <p className="mt-1 font-semibold text-slate-900">{match.recipe.difficulty}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Você já tem</p>
            <p className="mt-2 text-sm leading-6 text-emerald-950">{available.length > 0 ? available.join(", ") : "Vamos sugerir outras combinações."}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Faltando</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{missing.length > 0 ? missing.join(", ") : "Nada obrigatório faltando."}</p>
          </div>
        </div>

        <Link
          href={`/receitas/${match.recipe.slug}?ingredientes=${selectedIds.join(",")}`}
          className="inline-flex min-h-12 items-center justify-center rounded-[18px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ver receita
        </Link>
      </div>
    </article>
  );
}
