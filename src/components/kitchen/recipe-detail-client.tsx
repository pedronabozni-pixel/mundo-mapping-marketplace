"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ingredientParamName, parseIngredientIds } from "@/lib/kitchen-query";
import { matchRecipe } from "@/lib/kitchen-matching";
import { useKitchen } from "@/components/kitchen/kitchen-provider";

export function RecipeDetailClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const selectedIds = parseIngredientIds(searchParams.get(ingredientParamName()));
  const { recipes, ingredients, favoriteIds, toggleFavorite, ready } = useKitchen();
  const [copied, setCopied] = useState(false);

  const recipe = recipes.find((item) => item.slug === slug);
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);

  if (!ready) {
    return <div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando receita...</div>;
  }

  if (!recipe) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        Receita não encontrada.
      </div>
    );
  }

  const resolvedRecipe = recipe;
  const match = matchRecipe(resolvedRecipe, selectedIds);
  const shoppingList = match.missingRequiredIds.map((id) => ingredientMap.get(id)?.name).filter(Boolean);

  async function copyShoppingList() {
    if (shoppingList.length === 0) return;
    await navigator.clipboard.writeText(`Lista de compras para ${resolvedRecipe.name}\n- ${shoppingList.join("\n- ")}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.32)]">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="aspect-[16/11] lg:aspect-auto">
            <img src={resolvedRecipe.image} alt={resolvedRecipe.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div>
              <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {match.label}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{resolvedRecipe.name}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{resolvedRecipe.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tempo</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedRecipe.prepMinutes} min</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rendimento</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedRecipe.servings}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dificuldade</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedRecipe.difficulty}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categoria</p>
                <p className="mt-1 font-semibold text-slate-900">{resolvedRecipe.mealType}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => toggleFavorite(resolvedRecipe.id)}
                className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {favoriteIds.includes(resolvedRecipe.id) ? "Remover dos favoritos" : "Salvar nos favoritos"}
              </button>
              <button
                type="button"
                onClick={copyShoppingList}
                className="inline-flex min-h-12 items-center justify-center rounded-[18px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {shoppingList.length === 0 ? "Nada faltando" : copied ? "Lista copiada" : "Gerar lista de compras"}
              </button>
            </div>

            <Link
              href={`/resultados?ingredientes=${selectedIds.join(",")}`}
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
            >
              Voltar para resultados
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ingredientes</h2>
          <div className="mt-5 grid gap-3">
            {resolvedRecipe.ingredients.map((item) => {
              const hasIngredient = selectedIds.includes(item.ingredientId);
              const ingredient = ingredientMap.get(item.ingredientId);
              return (
                <div
                  key={`${resolvedRecipe.id}-${item.ingredientId}`}
                  className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 ${hasIngredient ? "border-emerald-200 bg-emerald-50" : item.optional ? "border-slate-200 bg-slate-50" : "border-amber-200 bg-amber-50"}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{ingredient?.name}</p>
                    <p className="text-sm text-slate-600">{item.quantity}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${hasIngredient ? "bg-emerald-100 text-emerald-800" : item.optional ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
                    {hasIngredient ? "Você tem" : item.optional ? "Opcional" : "Falta"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Modo de preparo</h2>
            <div className="mt-5 grid gap-3">
              {resolvedRecipe.steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Substituições possíveis</h2>
            <div className="mt-4 grid gap-3">
              {resolvedRecipe.substitutions.map((item) => (
                <div key={`${resolvedRecipe.id}-${item.ingredientId}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{ingredientMap.get(item.ingredientId)?.name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Utensílios necessários</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {resolvedRecipe.utensils.map((utensil) => (
                <span key={utensil} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  {utensil}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
