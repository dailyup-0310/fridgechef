export type Mode = "daily" | "diet";

export interface DailyPreferences {
  mealType?: "breakfast" | "lunch" | "main";
  cookTime?: string;  // minutes as string, e.g. "30" — matches slider output
  cuisine?: "Chinese" | "Western" | "Japanese" | "Korean";
  flavor?: "Mild" | "Medium" | "Bold";
}

export interface DietPreferences {
  mealType?: "breakfast" | "lunch" | "main";
  cookTime?: string;
  cuisine?: "Chinese" | "Western" | "Japanese" | "Korean";
  calorieTarget?: number;
}
