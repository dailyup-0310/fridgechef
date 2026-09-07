export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  usedUserIngredients: string[];
  steps: string[];
  cookTimeMinutes: number;
  difficulty: Difficulty;
  calories?: number;   // required in diet mode, omitted in daily
  imageUrl?: string;
}
