"use client";

import { useMemo, useState } from "react";
import { ingredientCategories } from "@/data/kitchen";
import { matchRecipe } from "@/lib/kitchen-matching";
import { slugify } from "@/lib/utils";
import { useKitchen } from "@/components/kitchen/kitchen-provider";
import type { DietaryStyle, DifficultyLevel, Ingredient, MealType, Recipe } from "@/types/kitchen";

const dietaryOptions: DietaryStyle[] = ["Vegetariano", "Fit", "High protein", "Econômico"];
const difficultyOptions: DifficultyLevel[] = ["Fácil", "Médio", "Avançado"];
const mealOptions: MealType[] = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

function emptyRecipe(): Recipe {
  return {
    id: "",
    slug: "",
    name: "",
    description: "",
    image: "",
    prepMinutes: 20,
    servings: "2 porções",
    difficulty: "Fácil",
    mealType: "Almoço",
    dietaryStyles: [],
    tags: [],
    noOven: true,
    lowDish: false,
    heroIngredientIds: [],
    utensils: [],
    steps: ["", "", ""],
    ingredients: [],
    substitutions: []
  };
}

export function AdminClient() {
  const { recipes, ingredients, saveRecipe, deleteRecipe, saveIngredient, deleteIngredient, ready } = useKitchen();
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient])), [ingredients]);
  const [draft, setDraft] = useState<Recipe>(emptyRecipe());
  const [simulationIds, setSimulationIds] = useState<string[]>(["ovo", "tomate", "arroz"]);
  const [ingredientDraft, setIngredientDraft] = useState<Ingredient>({
    id: "",
    name: "",
    category: "proteinas",
    perishability: 3,
    aliases: []
  });

  const simulatedMatch = draft.name ? matchRecipe({ ...draft, id: draft.id || slugify(draft.name), slug: draft.slug || slugify(draft.name) }, simulationIds) : null;

  function toggleRecipeIngredient(id: string, optional: boolean) {
    setDraft((current) => {
      const already = current.ingredients.find((item) => item.ingredientId === id);
      if (!already) {
        return {
          ...current,
          ingredients: [...current.ingredients, { ingredientId: id, quantity: "a gosto", optional }]
        };
      }

      return {
        ...current,
        ingredients: current.ingredients.map((item) =>
          item.ingredientId === id ? { ...item, optional } : item
        )
      };
    });
  }

  function removeRecipeIngredient(id: string) {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.filter((item) => item.ingredientId !== id)
    }));
  }

  function editRecipe(recipe: Recipe) {
    setDraft(recipe);
  }

  function submitRecipe() {
    if (!draft.name.trim() || draft.ingredients.length === 0) return;
    saveRecipe({
      ...draft,
      id: draft.id || slugify(draft.name),
      slug: draft.slug || slugify(draft.name),
      heroIngredientIds: draft.heroIngredientIds.length > 0 ? draft.heroIngredientIds : draft.ingredients.slice(0, 3).map((item) => item.ingredientId),
      tags: draft.tags.filter(Boolean),
      steps: draft.steps.filter((step) => step.trim()),
      utensils: draft.utensils.filter(Boolean),
      substitutions: draft.substitutions.filter((item) => item.suggestion.trim())
    });
    setDraft(emptyRecipe());
  }

  function submitIngredient() {
    if (!ingredientDraft.name.trim()) return;
    const id = ingredientDraft.id || slugify(ingredientDraft.name);
    saveIngredient({ ...ingredientDraft, id, aliases: ingredientDraft.aliases?.filter(Boolean) ?? [] });
    setIngredientDraft({ id: "", name: "", category: "proteinas", perishability: 3, aliases: [] });
  }

  if (!ready) {
    return <div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando painel...</div>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[36px] border border-white/80 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.3)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Painel admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Cadastro simples de receitas e ingredientes</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          MVP local com persistência em `localStorage`, preparado para trocar o storage por API ou banco real depois.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6 rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{draft.id ? "Editar receita" : "Cadastrar receita"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Defina ingredientes obrigatórios e opcionais, tempo, tags e atributos de busca.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome da receita"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              value={draft.servings}
              onChange={(event) => setDraft((current) => ({ ...current, servings: event.target.value }))}
              placeholder="Rendimento"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              type="number"
              value={draft.prepMinutes}
              onChange={(event) => setDraft((current) => ({ ...current, prepMinutes: Number(event.target.value) }))}
              placeholder="Tempo"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <select
              value={draft.difficulty}
              onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value as DifficultyLevel }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              {difficultyOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={draft.mealType}
              onChange={(event) => setDraft((current) => ({ ...current, mealType: event.target.value as MealType }))}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              {mealOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={draft.tags.join(", ")}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((item) => item.trim()) }))}
              placeholder="Tags separadas por vírgula"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descrição curta da receita"
            className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Estilos alimentares</p>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((style) => {
                const active = draft.dietaryStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        dietaryStyles: active
                          ? current.dietaryStyles.filter((item) => item !== style)
                          : [...current.dietaryStyles, style]
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Ingredientes</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient) => {
                const selected = draft.ingredients.find((item) => item.ingredientId === ingredient.id);
                return (
                  <div key={ingredient.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span>{ingredient.name}</span>
                    <button type="button" onClick={() => toggleRecipeIngredient(ingredient.id, false)} className={`rounded-full px-3 py-1 ${selected && !selected.optional ? "bg-emerald-600 text-white" : "bg-white text-slate-700"}`}>
                      Obrig.
                    </button>
                    <button type="button" onClick={() => toggleRecipeIngredient(ingredient.id, true)} className={`rounded-full px-3 py-1 ${selected && selected.optional ? "bg-amber-500 text-white" : "bg-white text-slate-700"}`}>
                      Opc.
                    </button>
                    {selected ? (
                      <button type="button" onClick={() => removeRecipeIngredient(ingredient.id)} className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">
                        ×
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <textarea
              value={draft.steps.join("\n")}
              onChange={(event) => setDraft((current) => ({ ...current, steps: event.target.value.split("\n") }))}
              placeholder="Modo de preparo, uma linha por passo"
              className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <textarea
              value={draft.utensils.join("\n")}
              onChange={(event) => setDraft((current) => ({ ...current, utensils: event.target.value.split("\n") }))}
              placeholder="Utensílios, uma linha por item"
              className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.noOven}
                onChange={(event) => setDraft((current) => ({ ...current, noOven: event.target.checked }))}
              />
              Sem forno
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.lowDish}
                onChange={(event) => setDraft((current) => ({ ...current, lowDish: event.target.checked }))}
              />
              Pouca louça
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={submitRecipe} className="inline-flex min-h-12 items-center justify-center rounded-[18px] bg-slate-900 px-5 text-sm font-semibold text-white">
              Salvar receita
            </button>
            <button type="button" onClick={() => setDraft(emptyRecipe())} className="inline-flex min-h-12 items-center justify-center rounded-[18px] border border-slate-200 px-5 text-sm font-semibold text-slate-700">
              Limpar formulário
            </button>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Compatibilidade simulada</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Marque alguns ingredientes para testar a lógica de matching durante o cadastro.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {ingredients.map((ingredient) => {
                const active = simulationIds.includes(ingredient.id);
                return (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() =>
                      setSimulationIds((current) =>
                        active ? current.filter((id) => id !== ingredient.id) : [...current, ingredient.id]
                      )
                    }
                    className={`rounded-full px-3 py-2 text-sm ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    {ingredient.name}
                  </button>
                );
              })}
            </div>

            {simulatedMatch ? (
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Status</p>
                  <p className="mt-1 font-semibold text-emerald-950">{simulatedMatch.label}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Score</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{Math.round(simulatedMatch.score)}</p>
                  <p className="mt-1 text-sm text-slate-600">Compatibilidade de {simulatedMatch.compatibility}%</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Cadastrar ingrediente</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={ingredientDraft.name}
                onChange={(event) =>
                  setIngredientDraft((current) => ({ ...current, name: event.target.value, id: current.id || slugify(event.target.value) }))
                }
                placeholder="Nome do ingrediente"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
              <select
                value={ingredientDraft.category}
                onChange={(event) => setIngredientDraft((current) => ({ ...current, category: event.target.value as Ingredient["category"] }))}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              >
                {ingredientCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Perecibilidade
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={ingredientDraft.perishability}
                  onChange={(event) => setIngredientDraft((current) => ({ ...current, perishability: Number(event.target.value) }))}
                />
              </label>
              <button type="button" onClick={submitIngredient} className="inline-flex min-h-12 items-center justify-center rounded-[18px] bg-emerald-600 px-5 text-sm font-semibold text-white">
                Salvar ingrediente
              </button>
            </div>
          </section>
        </aside>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Receitas cadastradas</h2>
          <div className="mt-4 grid gap-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{recipe.name}</p>
                  <p className="text-sm text-slate-600">{recipe.mealType} · {recipe.prepMinutes} min · {recipe.ingredients.length} ingredientes</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editRecipe(recipe)} className="rounded-full bg-white px-4 py-2 text-sm text-slate-700">
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteRecipe(recipe.id)} className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ingredientes cadastrados</h2>
          <div className="mt-4 grid gap-3">
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{ingredient.name}</p>
                  <p className="text-sm text-slate-600">Perecibilidade {ingredient.perishability}/5 · {ingredient.category.replace("-", " ")}</p>
                </div>
                <button type="button" onClick={() => deleteIngredient(ingredient.id)} className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700">
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
