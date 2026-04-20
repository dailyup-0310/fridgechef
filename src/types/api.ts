import type { Mode, DailyPreferences, DietPreferences } from "./preference";
import type { Recipe, Difficulty } from "./recipe";

// ── What the frontend sends to POST /api/generate ──────────────────────────
export interface GenerateRequest {
  mode: Mode;
  ingredients: string[];                         // IngredientItem.normalized, non-empty only
  preferences: DailyPreferences | DietPreferences;
  excludeNames?: string[];                       // already-shown recipe names to avoid repeats
}

// ── Exact JSON schema the AI model must return ──────────────────────────────
export interface AIRecipeItem {
  name: string;
  description: string;                           // one sentence, ≤20 chars
  ingredients: string[];                         // only user-provided ingredients + basic pantry staples
  usedUserIngredients: string[];                 // subset of user-supplied ingredients actually used
  steps: string[];                               // ordered cooking steps
  cookTimeMinutes: number;                       // realistic total time in minutes
  difficulty: Difficulty;
  calories?: number;                             // kcal per serving; required in diet mode
  imageQuery: string;                            // English search keywords for Pexels
}

export interface AIResponsePayload {
  recipes: AIRecipeItem[];
  allShown?: boolean;             // true when AI can't produce new non-duplicate recipes
  noRecipePossible?: boolean;     // true when ingredients are insufficient for any recipe
  suggestedIngredients?: string[]; // recommended ingredients to add when noRecipePossible
}

// ── What POST /api/generate returns to the frontend ─────────────────────────
export interface GenerateResponse {
  success: boolean;
  recipes: Recipe[];
  error?: string;
  noMoreRecipes?: boolean;
  noRecipePossible?: boolean;
  suggestedIngredients?: string[];
}
