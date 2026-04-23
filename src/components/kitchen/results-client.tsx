"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ingredientParamName, parseIngredientIds } from "@/lib/kitchen-query";
import { getRecipeMatches } from "@/lib/kitchen-matching";
import { useKitchen } from "@/components/kitchen/kitchen-provider";
import { RecipeCard } from "@/components/kitchen/recipe-card";
import type { ResultFilters } from "@/types/kitchen";

export function ResultsClient() {
  const searchParams = useSearchParams();
  const selectedIds = parseIngredientIds(searchParams.get(ingredientParamName()));
  const { ingredients, recipes, ready } = useKitchen();
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const selectedIngredients = selectedIds.map((id) => ingredientMap.get(id)).filter(Boolean);

  const [filters, setFilters] = useState<ResultFilters>({
    difficulty: "Todos",
    mealType: "Todas",
    dietaryStyle: "Todos",
    allowMissingUpTo: 3,
    onlyAvailable: false,
    lowDish: false,
    noOven: false
  });

  const matches = useMemo(() => getRecipeMatches(recipes, selectedIds, filters), [filters, recipes, selectedIds]);

  const summary = useMemo(() => {
    const readyNow = matches.filter((match) => match.canCookNow).length;
    const closeCalls = matches.filter((match) => !match.canCookNow && match.missingRequiredIds.length <= 3).length;
    return { readyNow, closeCalls };
  }, [matches]);

  if (!ready) {
    return <div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando sugestões...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Sua geladeira</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Receitas priorizadas pelo que você já tem</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {summary.readyNow} prontas agora e {summary.closeCalls} com poucos itens faltando.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map((ingredient) => (
              <span key={ingredient!.id} className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                {ingredient!.name}
              </span>
            ))}
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Tempo de preparo
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                value={filters.maxPrepMinutes ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    maxPrepMinutes: event.target.value ? Number(event.target.value) : undefined
                  }))
                }
              >
                <option value="">Qualquer tempo</option>
                <option value="15">Até 15 min</option>
                <option value="30">Até 30 min</option>
                <option value="45">Até 45 min</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Dificuldade
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                value={filters.difficulty}
                onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value as ResultFilters["difficulty"] }))}
              >
                <option value="Todos">Todas</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Avançado">Avançado</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Tipo de refeição
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                value={filters.mealType}
                onChange={(event) => setFilters((current) => ({ ...current, mealType: event.target.value as ResultFilters["mealType"] }))}
              >
                <option value="Todas">Todas</option>
                <option value="Café da manhã">Café da manhã</option>
                <option value="Almoço">Almoço</option>
                <option value="Jantar">Jantar</option>
                <option value="Lanche">Lanche</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Estilo alimentar
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                value={filters.dietaryStyle}
                onChange={(event) => setFilters((current) => ({ ...current, dietaryStyle: event.target.value as ResultFilters["dietaryStyle"] }))}
              >
                <option value="Todos">Todos</option>
                <option value="Vegetariano">Vegetariano</option>
                <option value="Fit">Fit</option>
                <option value="High protein">High protein</option>
                <option value="Econômico">Econômico</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Ingredientes faltando
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                value={filters.onlyAvailable ? "0" : filters.allowMissingUpTo ?? 3}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    onlyAvailable: value === 0,
                    allowMissingUpTo: value
                  }));
                }}
              >
                <option value="0">Só receitas com o que tenho</option>
                <option value="1">Aceitar até 1 ingrediente faltando</option>
                <option value="2">Aceitar até 2 ingredientes faltando</option>
                <option value="3">Aceitar até 3 ingredientes faltando</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!filters.lowDish}
                onChange={(event) => setFilters((current) => ({ ...current, lowDish: event.target.checked }))}
              />
              Pouca louça
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!filters.noOven}
                onChange={(event) => setFilters((current) => ({ ...current, noOven: event.target.checked }))}
              />
              Sem forno
            </label>
          </div>

          <Link href="/buscar" className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Ajustar ingredientes
          </Link>
        </div>
      </aside>

      <section className="grid gap-5">
        {matches.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-600">
            Nenhuma receita apareceu com esse conjunto de filtros. Tente ampliar o limite de ingredientes faltando.
          </div>
        ) : (
          matches.map((match) => <RecipeCard key={match.recipe.id} match={match} ingredientMap={ingredientMap} selectedIds={selectedIds} />)
        )}
      </section>
    </div>
  );
}
