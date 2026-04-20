export type Mode = "daily" | "diet";

export interface DailyPreferences {
  mealType?: "breakfast" | "lunch" | "main";
  cookTime?: string;  // minutes as string, e.g. "30" — matches slider output
  cuisine?: "中餐" | "西餐" | "日餐" | "韩餐";
  flavor?: "清淡" | "微辣" | "适中" | "重口";
}

export interface DietPreferences {
  mealType?: "breakfast" | "lunch" | "main";
  cookTime?: string;
  cuisine?: "中餐" | "西餐" | "日餐" | "韩餐";
  calorieTarget?: number;
}
