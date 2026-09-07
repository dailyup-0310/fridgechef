import type { GenerateRequest } from "@/types/api";
import type { DailyPreferences, DietPreferences } from "@/types/preference";

const JSON_SCHEMA = `{
  "recipes": [
    {
      "name": "Recipe name",
      "description": "One-sentence description, under 20 words",
      "ingredients": ["only user-provided ingredients + basic pantry items"],
      "usedUserIngredients": ["user ingredients actually used in this recipe"],
      "steps": ["Step 1", "Step 2"],
      "cookTimeMinutes": 30,
      "difficulty": "Easy",
      "calories": 350,
      "imageQuery": "dish name in english 2-4 words"
    }
  ]
}`;

const NO_RECIPE_SCHEMA = `{
  "recipes": [],
  "noRecipePossible": true,
  "suggestedIngredients": ["suggested ingredient 1", "suggested ingredient 2", "suggested ingredient 3"]
}`;

const ALL_SHOWN_SCHEMA = `{
  "recipes": [],
  "allShown": true
}`;

const COOK_TIME_GUIDE = `
[Cook Time Reference — Must Follow Strictly]
- Stir-fry, pan-fried eggs, fried rice: 10–20 minutes
- Steamed dishes, steamed egg, blanched: 15–25 minutes
- Braised fish, sweet and sour pork: 30–45 minutes
- Red-braised pork, stewed chicken, braised ribs: 60–90 minutes
- Potato beef stew, brisket stew, lamb soup: 90–120 minutes
- Marinated dishes (requiring advance marinade): total time must include marinating time
Never estimate long-braising dishes as under 30 minutes. cookTimeMinutes must be a realistic integer.`.trim();

const BASIC_PANTRY = "salt, oil, sugar, soy sauce, light soy sauce, dark soy sauce, vinegar, cooking wine, cornstarch, scallions, ginger, garlic, white pepper, Sichuan peppercorn, star anise, bay leaves, chili, doubanjiang, oyster sauce, sesame oil, sesame seeds";

export function buildSystemPrompt(isDiet: boolean): string {
  return `You are a professional home cooking assistant. Based on the user's ingredients and preferences, recommend suitable home-cooking recipes. All recipe content (name, description, ingredients, steps) must be in English.

[Strict Rules]
1. Return valid JSON only — no extra text, comments, or markdown code blocks
2. [Ingredient Restriction — Most Important Rule] The recipe's ingredients field may only contain:
   a) Ingredients provided by the user
   b) Basic pantry items (${BASIC_PANTRY})
   Absolutely do not include any main ingredient the user did not provide (e.g., no chicken if the user didn't list chicken, no tofu if not listed)
3. If the user's ingredients cannot form any recipe, return:
${NO_RECIPE_SCHEMA}
   suggestedIngredients should list 3–5 ingredients that would best complement what the user already has
4. If the [Already Shown] list has exhausted all possible recipes for the user's ingredients, return:
${ALL_SHOWN_SCHEMA}
5. In the normal case, the recipes array contains exactly 3 unique recipes
6. usedUserIngredients should only include user-provided ingredients that actually appear in this recipe
7. Each step in steps should be concise and beginner-friendly
${isDiet ? "8. Must provide a calorie estimate for each recipe (calories, in kcal, for a normal single serving)\n9. Recommend low-oil, low-sugar, high-protein, or high-fiber healthy preparations" : "8. The calories field may be omitted"}

${COOK_TIME_GUIDE}

[Output Format (normal)]
${JSON_SCHEMA}

difficulty must be one of: "Easy" | "Medium" | "Hard"
imageQuery rule: 2–4 English words describing the dish's appearance for image search. Examples:
- Tomato egg stir fry → "tomato egg stir fry"
- Red braised pork → "braised pork belly"
- Steamed egg tofu → "steamed tofu egg"
- Poached fish → "sichuan poached fish"
- Caesar salad → "caesar salad"
Do not include broad words like "chinese", "food" — describe the dish directly`;
}

export function buildUserPrompt(req: GenerateRequest): string {
  const { mode, ingredients, preferences, excludeNames } = req;
  const isDiet = mode === "diet";

  const lines: string[] = [];

  lines.push(`Mode: ${isDiet ? "Diet / Healthy Mode" : "Daily Mode"}`);

  if (ingredients.length > 0) {
    lines.push(`I have these ingredients: ${ingredients.join(", ")}`);
    lines.push(`(Note: only use these ingredients plus basic pantry items — do not add unlisted main ingredients)`);
  } else {
    lines.push("Ingredients: not specified (please recommend simple everyday dishes)");
  }

  const mealMap: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", main: "Main Meal" };
  if (preferences.mealType) {
    lines.push(`Meal type: ${mealMap[preferences.mealType] ?? preferences.mealType}`);
  }
  if (preferences.cookTime && preferences.cookTime !== "0") {
    lines.push(`Cook time: under ${preferences.cookTime} minutes`);
  }

  const d = preferences as DailyPreferences & DietPreferences;
  if (d.cuisine) lines.push(`Cuisine preference: ${d.cuisine}`);

  if (!isDiet) {
    if (d.flavor) {
      const flavorGuide: Record<string, string> = {
        Mild: "Mild (low oil, low salt, not spicy — preferably steamed, boiled, or light stir-fry; avoid heavy sauces or spicy dishes)",
        Medium: "Medium (normal home-style seasoning, not too salty or spicy — regular stir-fry and braised dishes are all fine)",
        Bold: "Bold (strongly flavored only — must be one of: spicy/numbing, soy-braised, red-braised, poached in chili oil, or heavily salted/marinated; plain stir-fries are not allowed regardless of garlic or chili added)",
      };
      lines.push(`Flavor preference: ${flavorGuide[d.flavor] ?? d.flavor} — all recommended recipes must match this flavor profile`);
    }
  } else {
    if (d.calorieTarget) lines.push(`Calorie target per dish: under ${d.calorieTarget} kcal`);
  }

  if (excludeNames && excludeNames.length > 0) {
    lines.push(`\n[Already Shown — Do Not Repeat]: ${excludeNames.join(", ")}`);
    lines.push(`If all possible recipes for these ingredients have been recommended, return allShown: true in the JSON`);
  }

  lines.push("\nPlease return the recipe JSON:");
  return lines.join("\n");
}

export function extractIngredientNames(
  items: { input: string; normalized: string }[]
): string[] {
  return items
    .map((i) => i.normalized.trim() || i.input.trim())
    .filter(Boolean);
}
