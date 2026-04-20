import type { GenerateRequest } from "@/types/api";
import type { DailyPreferences, DietPreferences } from "@/types/preference";

const JSON_SCHEMA = `{
  "recipes": [
    {
      "name": "菜名",
      "description": "一句话简介，不超过20字",
      "ingredients": ["只能是用户提供的食材 + 基础调料"],
      "usedUserIngredients": ["用户食材中实际用到的"],
      "steps": ["步骤1", "步骤2"],
      "cookTimeMinutes": 30,
      "difficulty": "简单",
      "calories": 350,
      "imageQuery": "dish name in english 2-4 words"
    }
  ]
}`;

const NO_RECIPE_SCHEMA = `{
  "recipes": [],
  "noRecipePossible": true,
  "suggestedIngredients": ["建议添加的食材1", "建议添加的食材2", "建议添加的食材3"]
}`;

const ALL_SHOWN_SCHEMA = `{
  "recipes": [],
  "allShown": true
}`;

const COOK_TIME_GUIDE = `
【烹饪时长参考标准 — 必须严格遵守】
- 炒菜、煎蛋、炒饭：10–20 分钟
- 蒸菜、炖蛋、汆烫：15–25 分钟
- 红烧鱼、糖醋里脊：30–45 分钟
- 红烧肉、炖鸡、炖排骨：60–90 分钟
- 土豆炖牛肉、牛腩煲、羊肉汤：90–120 分钟
- 腌制类（需提前腌）：总时长要包含腌制时间
禁止把需要长时间炖煮的菜估为30分钟以内。cookTimeMinutes 必须是真实准确的整数。`.trim();

const BASIC_PANTRY = "盐、油、糖、酱油、生抽、老抽、醋、料酒、淀粉、葱、姜、蒜、胡椒粉、花椒、八角、香叶、辣椒、豆瓣酱、蚝油、香油、芝麻";

export function buildSystemPrompt(isDiet: boolean): string {
  return `你是一位专业的家庭厨师助手。根据用户的食材和偏好，推荐适合家庭烹饪的菜谱。

【严格规则】
1. 只返回合法 JSON，不得包含任何额外文字、注释或 markdown 代码块
2. 【食材限制 — 最重要的规则】菜谱的 ingredients 字段只能包含：
   a) 用户提供的食材
   b) 基础调料（${BASIC_PANTRY}）
   绝对禁止在菜谱中出现用户未提供的主食材（如用户没有鸡肉就不能出现鸡肉，没有豆腐就不能出现豆腐）
3. 如果用户的食材完全无法组成任何菜谱，返回：
${NO_RECIPE_SCHEMA}
   suggestedIngredients 中推荐 3-5 种最适合搭配用户现有食材的食材
4. 如果【已推荐过】列表中的菜已经穷尽了用户食材能做的所有菜谱，返回：
${ALL_SHOWN_SCHEMA}
5. 正常情况下 recipes 数组包含3个不重复的菜谱
6. usedUserIngredients 只填写用户食材中实际出现在该菜谱里的
7. steps 每步简洁清晰，适合新手操作
${isDiet ? "8. 必须提供每道菜的热量估算（calories，单位 kcal，基于正常一人份）\n9. 推荐低油少糖、高蛋白或高纤维的健康做法" : "8. calories 字段可省略"}

${COOK_TIME_GUIDE}

【返回格式（正常）】
${JSON_SCHEMA}

difficulty 只能取："简单" | "中等" | "较难"
imageQuery 规则：2–4 个英文单词，描述菜品外观，用于图片搜索。示例：
- 番茄炒鸡蛋 → "tomato egg stir fry"
- 红烧肉 → "braised pork belly"
- 蒸蛋豆腐 → "steamed tofu egg"
- 水煮鱼 → "sichuan poached fish"
- 凯撒沙拉 → "caesar salad"
不要包含 "chinese"、"food" 等宽泛词，直接描述菜品本身`;
}

export function buildUserPrompt(req: GenerateRequest): string {
  const { mode, ingredients, preferences, excludeNames } = req;
  const isDiet = mode === "diet";

  const lines: string[] = [];

  lines.push(`模式：${isDiet ? "减脂健康模式" : "日常模式"}`);

  if (ingredients.length > 0) {
    lines.push(`我有这些食材：${ingredients.join("、")}`);
    lines.push(`（注意：只能使用这些食材和基础调料来设计菜谱，不得添加未列出的主食材）`);
  } else {
    lines.push("食材：未指定（请推荐简单家常菜）");
  }

  const mealMap: Record<string, string> = { breakfast: "早餐", lunch: "午餐", main: "正餐" };
  if (preferences.mealType) {
    lines.push(`餐别：${mealMap[preferences.mealType] ?? preferences.mealType}`);
  }
  if (preferences.cookTime && preferences.cookTime !== "0") {
    lines.push(`做饭时长：${preferences.cookTime} 分钟以内`);
  }

  const d = preferences as DailyPreferences & DietPreferences;
  if (d.cuisine) lines.push(`菜系偏好：${d.cuisine}`);

  if (!isDiet) {
    if (d.flavor) {
      const flavorGuide: Record<string, string> = {
        清淡: "清淡（少油少盐不辣，如蒸、水煮、凉拌、清炒，禁止出现重油重辣或酱味浓郁的菜）",
        适中: "适中（正常家常调味，不过咸不过辣，如普通炒菜、红烧等均可）",
        重口: "重口（只能推荐口味极其浓郁的菜，必须属于以下类型之一：麻辣类、酱爆类、红烧类、水煮肉片/水煮鱼类、盐分极重的腌制或卤制菜。所有普通炒菜一律不得出现，无论是否加了蒜或辣椒）",
      };
      lines.push(`口味偏好：${flavorGuide[d.flavor] ?? d.flavor}，所有推荐菜谱必须符合此口味，不符合的不得出现`);
    }
  } else {
    if (d.calorieTarget) lines.push(`每道菜热量目标：不超过 ${d.calorieTarget} kcal`);
  }

  if (excludeNames && excludeNames.length > 0) {
    lines.push(`\n【已推荐过，禁止重复】：${excludeNames.join("、")}`);
    lines.push(`如果这些食材能做的菜已经全部推荐完了，返回 allShown: true 的 JSON`);
  }

  lines.push("\n请返回菜谱 JSON：");
  return lines.join("\n");
}

export function extractIngredientNames(
  items: { input: string; normalized: string }[]
): string[] {
  return items
    .map((i) => i.normalized.trim() || i.input.trim())
    .filter(Boolean);
}
