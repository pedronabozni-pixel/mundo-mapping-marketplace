"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialIngredients, initialRecipes } from "@/data/kitchen";
import type { Ingredient, Recipe } from "@/types/kitchen";
import { slugify } from "@/lib/utils";

const RECIPES_KEY = "cookfinder:recipes";
const INGREDIENTS_KEY = "cookfinder:ingredients";
const FAVORITES_KEY = "cookfinder:favorites";

interface RecipeDraftInput extends Omit<Recipe, "id" | "slug" | "image"> {
  id?: string;
  slug?: string;
  image?: string;
}

interface KitchenContextValue {
  ready: boolean;
  ingredients: Ingredient[];
  recipes: Recipe[];
  favoriteIds: string[];
  toggleFavorite: (recipeId: string) => void;
  saveRecipe: (input: RecipeDraftInput) => void;
  deleteRecipe: (recipeId: string) => void;
  saveIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (ingredientId: string) => void;
}

const KitchenContext = createContext<KitchenContextValue | null>(null);

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function generateRecipeImage(name: string) {
  const initial = name.charAt(0).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fff0ce" />
          <stop offset="100%" stop-color="#b8efd9" />
        </linearGradient>
      </defs>
      <rect width="960" height="720" rx="48" fill="url(#g)" />
      <circle cx="760" cy="120" r="120" fill="rgba(255,255,255,0.25)" />
      <text x="96" y="410" font-family="Arial, sans-serif" font-size="220" font-weight="700" fill="#1f3a31">${initial}</text>
      <text x="96" y="520" font-family="Arial, sans-serif" font-size="48" fill="#31594d">${name}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function KitchenProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const storedIngredients = safeParse<Ingredient[]>(localStorage.getItem(INGREDIENTS_KEY), initialIngredients);
    const storedRecipes = safeParse<Recipe[]>(localStorage.getItem(RECIPES_KEY), initialRecipes);
    const storedFavorites = safeParse<string[]>(localStorage.getItem(FAVORITES_KEY), []);

    setIngredients(storedIngredients);
    setRecipes(storedRecipes);
    setFavoriteIds(storedFavorites);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
  }, [ingredients, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  }, [recipes, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, ready]);

  const value = useMemo<KitchenContextValue>(
    () => ({
      ready,
      ingredients,
      recipes,
      favoriteIds,
      toggleFavorite: (recipeId) => {
        setFavoriteIds((current) =>
          current.includes(recipeId) ? current.filter((item) => item !== recipeId) : [...current, recipeId]
        );
      },
      saveRecipe: (input) => {
        const id = input.id ?? slugify(input.name);
        const slug = input.slug ?? slugify(input.name);
        setRecipes((current) => {
          const nextRecipe: Recipe = {
            ...input,
            id,
            slug,
            image: input.image ?? generateRecipeImage(input.name)
          };
          const hasRecipe = current.some((recipe) => recipe.id === id);
          if (!hasRecipe) return [...current, nextRecipe];
          return current.map((recipe) => (recipe.id === id ? nextRecipe : recipe));
        });
      },
      deleteRecipe: (recipeId) => {
        setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
        setFavoriteIds((current) => current.filter((id) => id !== recipeId));
      },
      saveIngredient: (ingredient) => {
        setIngredients((current) => {
          const exists = current.some((item) => item.id === ingredient.id);
          if (!exists) return [...current, ingredient];
          return current.map((item) => (item.id === ingredient.id ? ingredient : item));
        });
      },
      deleteIngredient: (ingredientId) => {
        setIngredients((current) => current.filter((ingredient) => ingredient.id !== ingredientId));
        setRecipes((current) =>
          current.map((recipe) => ({
            ...recipe,
            heroIngredientIds: recipe.heroIngredientIds.filter((id) => id !== ingredientId),
            ingredients: recipe.ingredients.filter((item) => item.ingredientId !== ingredientId),
            substitutions: recipe.substitutions.filter((item) => item.ingredientId !== ingredientId)
          }))
        );
      }
    }),
    [favoriteIds, ingredients, ready, recipes]
  );

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export function useKitchen() {
  const context = useContext(KitchenContext);
  if (!context) throw new Error("useKitchen must be used within KitchenProvider");
  return context;
}
