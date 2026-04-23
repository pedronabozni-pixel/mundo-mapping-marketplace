import { initialIngredients } from "@/data/kitchen";
import type { Recipe, RecipeMatch, ResultFilters } from "@/types/kitchen";

const ingredientMap = new Map(initialIngredients.map((ingredient) => [ingredient.id, ingredient]));

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function matchRecipe(recipe: Recipe, selectedIngredientIds: string[]): RecipeMatch {
  const selected = new Set(selectedIngredientIds);
  const required = recipe.ingredients.filter((item) => !item.optional);
  const optional = recipe.ingredients.filter((item) => item.optional);

  const matchedRequiredIds = required.filter((item) => selected.has(item.ingredientId)).map((item) => item.ingredientId);
  const matchedOptionalIds = optional.filter((item) => selected.has(item.ingredientId)).map((item) => item.ingredientId);
  const missingRequiredIds = required.filter((item) => !selected.has(item.ingredientId)).map((item) => item.ingredientId);
  const missingOptionalIds = optional.filter((item) => !selected.has(item.ingredientId)).map((item) => item.ingredientId);

  const requiredCoverage = required.length === 0 ? 1 : matchedRequiredIds.length / required.length;
  const optionalCoverage = optional.length === 0 ? 0 : matchedOptionalIds.length / optional.length;

  const perishablesUsedIds = [...matchedRequiredIds, ...matchedOptionalIds].filter((id) => {
    const ingredient = ingredientMap.get(id);
    return ingredient ? ingredient.perishability >= 4 : false;
  });

  let score = requiredCoverage * 100;
  if (missingRequiredIds.length === 0) score += 40;
  if (missingRequiredIds.length > 0 && missingRequiredIds.length <= 3) score += 20 - missingRequiredIds.length * 4;
  if (missingRequiredIds.length > 3) score -= missingRequiredIds.length * 18;
  score += optionalCoverage * 20;
  score += recipe.prepMinutes <= 15 ? 12 : recipe.prepMinutes <= 30 ? 6 : 0;
  score += perishablesUsedIds.length * 5;
  score += recipe.lowDish ? 6 : 0;
  score += recipe.noOven ? 4 : 0;

  const compatibility = clamp(
    Math.round(requiredCoverage * 78 + optionalCoverage * 14 + Math.min(perishablesUsedIds.length, 3) * 3 + (recipe.prepMinutes <= 20 ? 4 : 0)),
    8,
    100
  );

  const canCookNow = missingRequiredIds.length === 0;
  const missingCount = missingRequiredIds.length;
  const label =
    missingCount === 0 ? "Você já consegue fazer" : missingCount === 1 ? "Falta 1 ingrediente" : `Faltam ${missingCount} ingredientes`;

  return {
    recipe,
    score,
    compatibility,
    matchedRequiredIds,
    matchedOptionalIds,
    missingRequiredIds,
    missingOptionalIds,
    perishablesUsedIds,
    label,
    canCookNow
  };
}

export function sortMatches(matches: RecipeMatch[]) {
  return [...matches].sort((a, b) => {
    if (a.canCookNow !== b.canCookNow) return a.canCookNow ? -1 : 1;
    if (a.missingRequiredIds.length !== b.missingRequiredIds.length) {
      return a.missingRequiredIds.length - b.missingRequiredIds.length;
    }
    if (a.recipe.prepMinutes !== b.recipe.prepMinutes) return a.recipe.prepMinutes - b.recipe.prepMinutes;
    if (a.perishablesUsedIds.length !== b.perishablesUsedIds.length) {
      return b.perishablesUsedIds.length - a.perishablesUsedIds.length;
    }
    return b.score - a.score;
  });
}

export function getRecipeMatches(recipes: Recipe[], selectedIngredientIds: string[], filters: ResultFilters = {}) {
  return sortMatches(
    recipes
      .map((recipe) => matchRecipe(recipe, selectedIngredientIds))
      .filter((match) => {
        if (filters.maxPrepMinutes && match.recipe.prepMinutes > filters.maxPrepMinutes) return false;
        if (filters.difficulty && filters.difficulty !== "Todos" && match.recipe.difficulty !== filters.difficulty) return false;
        if (filters.mealType && filters.mealType !== "Todas" && match.recipe.mealType !== filters.mealType) return false;
        if (filters.dietaryStyle && filters.dietaryStyle !== "Todos" && !match.recipe.dietaryStyles.includes(filters.dietaryStyle)) return false;
        if (filters.onlyAvailable && match.missingRequiredIds.length > 0) return false;
        if (typeof filters.allowMissingUpTo === "number" && match.missingRequiredIds.length > filters.allowMissingUpTo) return false;
        if (filters.lowDish && !match.recipe.lowDish) return false;
        if (filters.noOven && !match.recipe.noOven) return false;
        return true;
      })
  );
}
