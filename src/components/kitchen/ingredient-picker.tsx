"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ingredientCategories } from "@/data/kitchen";
import { ingredientParamName } from "@/lib/kitchen-query";
import { useKitchen } from "@/components/kitchen/kitchen-provider";

interface IngredientPickerProps {
  initialSelectedIds?: string[];
  title?: string;
  compact?: boolean;
}

export function IngredientPicker({
  initialSelectedIds = [],
  title = "Quais ingredientes você já tem em casa?",
  compact = false
}: IngredientPickerProps) {
  const router = useRouter();
  const { ingredients, ready } = useKitchen();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"todos" | (typeof ingredientCategories)[number]["id"]>("todos");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ingredients
      .filter((ingredient) => {
        if (selectedSet.has(ingredient.id)) return false;
        if (activeCategory !== "todos" && ingredient.category !== activeCategory) return false;
        if (!normalizedQuery) return ingredient.popular;
        return (
          ingredient.name.toLowerCase().includes(normalizedQuery) ||
          ingredient.aliases?.some((alias) => alias.toLowerCase().includes(normalizedQuery))
        );
      })
      .slice(0, 10);
  }, [activeCategory, ingredients, query, selectedSet]);

  const popularIngredients = useMemo(() => ingredients.filter((ingredient) => ingredient.popular).slice(0, 8), [ingredients]);

  function addIngredient(id: string) {
    if (selectedSet.has(id)) return;
    setSelectedIds((current) => [...current, id]);
    setQuery("");
  }

  function removeIngredient(id: string) {
    setSelectedIds((current) => current.filter((item) => item !== id));
  }

  function searchRecipes() {
    const params = new URLSearchParams();
    params.set(ingredientParamName(), selectedIds.join(","));
    router.push(`/resultados?${params.toString()}`);
  }

  return (
    <section className={`rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur-xl ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Busque por ingrediente, clique nos itens populares e monte sua geladeira em segundos.
          </p>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: ovo, tomate, arroz, frango..."
            className="w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          {ready && filteredSuggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-[24px] border border-slate-200 bg-white p-3 shadow-2xl">
              <div className="grid gap-2">
                {filteredSuggestions.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => addIngredient(ingredient.id)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-emerald-50"
                  >
                    <span className="font-medium text-slate-800">{ingredient.name}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{ingredient.category.replace("-", " ")}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedIds.length === 0 ? (
            <div className="rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Nenhum ingrediente selecionado ainda.
            </div>
          ) : (
            selectedIds.map((id) => {
              const ingredient = ingredients.find((item) => item.id === id);
              if (!ingredient) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeIngredient(id)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:border-emerald-400"
                >
                  {ingredient.name} ×
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("todos")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === "todos" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Todas
          </button>
          {ingredientCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === category.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {popularIngredients.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => addIngredient(ingredient.id)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {ingredient.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={searchRecipes}
            className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#ff9a3d,#1fb980)] px-6 text-base font-semibold text-white shadow-[0_20px_40px_-20px_rgba(31,185,128,0.7)] transition hover:scale-[1.01]"
          >
            Encontrar receitas
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              setQuery("");
            }}
            className="inline-flex min-h-14 items-center justify-center rounded-[20px] border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Limpar tudo
          </button>
        </div>
      </div>
    </section>
  );
}
