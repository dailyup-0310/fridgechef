import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { fetchRecipeImage } from "@/features/recipe/fetchImage";
import type { GenerateRequest, AIResponsePayload, GenerateResponse } from "@/types/api";
import type { Recipe } from "@/types/recipe";

function makeClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
}

function parseAIResponse(raw: string): AIResponsePayload {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const payload = JSON.parse(cleaned) as AIResponsePayload;
  if (!Array.isArray(payload.recipes)) {
    throw new Error("AI 返回格式错误：recipes 不是数组");
  }
  // Allow 0 recipes for special cases (allShown / noRecipePossible)
  if (payload.recipes.length > 0 && payload.recipes.length !== 3) {
    throw new Error(`期望3道菜谱，实际收到 ${payload.recipes.length} 道`);
  }
  return payload;
}

function toRecipes(payload: AIResponsePayload, ts: number, imageUrls: string[]): Recipe[] {
  return payload.recipes.map((item, i) => ({
    id: `ai-${ts}-${i}`,
    name: item.name,
    description: item.description,
    ingredients: item.ingredients,
    usedUserIngredients: item.usedUserIngredients ?? [],
    steps: item.steps,
    cookTimeMinutes: item.cookTimeMinutes,
    difficulty: item.difficulty,
    ...(item.calories != null ? { calories: item.calories } : {}),
    imageUrl: imageUrls[i] ?? "",
  }));
}

function jsonResp(body: GenerateResponse, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return jsonResp({ success: false, recipes: [], error: "请求格式错误" }, 400);
  }

  const { mode, ingredients } = body;
  if (mode !== "daily" && mode !== "diet") {
    return jsonResp({ success: false, recipes: [], error: "无效的 mode 参数" }, 400);
  }
  if (!Array.isArray(ingredients)) {
    return jsonResp({ success: false, recipes: [], error: "ingredients 格式错误" }, 400);
  }

  try {
    const client = makeClient();
    const isDiet = mode === "diet";

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 2048,
      messages: [
        { role: "system", content: buildSystemPrompt(isDiet) },
        { role: "user",   content: buildUserPrompt(body) },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    if (!text) throw new Error("DeepSeek 未返回内容");

    const payload = parseAIResponse(text);

    // Handle special cases: all recipes shown
    if (payload.allShown) {
      return jsonResp({ success: true, recipes: [], noMoreRecipes: true });
    }

    // Handle special cases: not enough ingredients for any recipe
    if (payload.noRecipePossible) {
      return jsonResp({
        success: true,
        recipes: [],
        noRecipePossible: true,
        suggestedIngredients: payload.suggestedIngredients ?? [],
      });
    }

    const ts = Date.now();
    const imageUrls = await Promise.all(
      payload.recipes.map((item) => fetchRecipeImage(item.imageQuery ?? ""))
    );

    const recipes = toRecipes(payload, ts, imageUrls);
    return jsonResp({ success: true, recipes });
  } catch (err) {
    console.error("[/api/generate]", err);
    const raw = err instanceof Error ? err.message : String(err);
    const msg = raw.includes("Insufficient Balance") || raw.includes("credit")
      ? "API 余额不足，请前往 platform.deepseek.com 充值后重试"
      : raw.includes("DEEPSEEK_API_KEY 未配置")
      ? "请先在 .env.local 中配置 DEEPSEEK_API_KEY"
      : raw.includes("rate limit") || raw.includes("overloaded")
      ? "请求太频繁，请稍等几秒再试"
      : "生成失败，请稍后重试";
    return jsonResp({ success: false, recipes: [], error: msg }, 500);
  }
}
