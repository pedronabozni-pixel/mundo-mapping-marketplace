export type IngredientCategory =
  | "proteinas"
  | "legumes-verduras"
  | "temperos"
  | "laticinios"
  | "massas-graos"
  | "enlatados"
  | "padaria"
  | "outros";

export type DifficultyLevel = "Fácil" | "Médio" | "Avançado";
export type MealType = "Café da manhã" | "Almoço" | "Jantar" | "Lanche";
export type DietaryStyle = "Vegetariano" | "Fit" | "High protein" | "Econômico";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  perishability: number;
  aliases?: string[];
  popular?: boolean;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: string;
  optional?: boolean;
  note?: string;
}

export interface RecipeSubstitution {
  ingredientId: string;
  suggestion: string;
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  prepMinutes: number;
  servings: string;
  difficulty: DifficultyLevel;
  mealType: MealType;
  dietaryStyles: DietaryStyle[];
  tags: string[];
  noOven: boolean;
  lowDish: boolean;
  heroIngredientIds: string[];
  utensils: string[];
  steps: string[];
  ingredients: RecipeIngredient[];
  substitutions: RecipeSubstitution[];
}

export interface RecipeMatch {
  recipe: Recipe;
  score: number;
  compatibility: number;
  matchedRequiredIds: string[];
  matchedOptionalIds: string[];
  missingRequiredIds: string[];
  missingOptionalIds: string[];
  perishablesUsedIds: string[];
  label: string;
  canCookNow: boolean;
}

export interface ResultFilters {
  maxPrepMinutes?: number;
  difficulty?: DifficultyLevel | "Todos";
  mealType?: MealType | "Todas";
  dietaryStyle?: DietaryStyle | "Todos";
  onlyAvailable?: boolean;
  allowMissingUpTo?: number;
  lowDish?: boolean;
  noOven?: boolean;
}
