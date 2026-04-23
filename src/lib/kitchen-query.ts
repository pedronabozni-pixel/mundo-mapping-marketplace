const INGREDIENTS_PARAM = "ingredientes";

export function parseIngredientIds(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toIngredientQuery(ids: string[]) {
  return `${INGREDIENTS_PARAM}=${ids.join(",")}`;
}

export function ingredientParamName() {
  return INGREDIENTS_PARAM;
}
