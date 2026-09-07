import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { fetchRecipeImage } from "@/features/recipe/fetchImage";
import { consumeOneUse } from "@/lib/invite";
import type { GenerateRequest, AIResponsePayload, GenerateResponse } from "@/types/api";
import type { Recipe } from "@/types/recipe";

function makeClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");
  return new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
}

function parseAIResponse(raw: string): AIResponsePayload {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const payload = JSON.parse(cleaned) as AIResponsePayload;
  if (!Array.isArray(payload.recipes)) {
    throw new Error("AI response error: recipes is not an array");
  }
  // Allow 0 recipes for special cases (allShown / noRecipePossible)
  if (payload.recipes.length > 0 && payload.recipes.length !== 3) {
    throw new Error(`Expected 3 recipes, got ${payload.recipes.length}`);
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
  // Read invite code from cookie and consume one use
  const cookieHeader = request.headers.get("cookie") ?? "";
  const inviteCode = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("fridge_auth="))
    ?.split("=")[1] ?? "";

  if (!inviteCode) {
    return jsonResp({ success: false, recipes: [], error: "Unauthorized, please enter your invite code" }, 401);
  }

  const usage = await consumeOneUse(inviteCode);
  if (!usage.valid) {
    return jsonResp({ success: false, recipes: [], error: usage.error ?? "Invite code usage limit reached" }, 403);
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return jsonResp({ success: false, recipes: [], error: "Invalid request format" }, 400);
  }

  const { mode, ingredients } = body;
  if (mode !== "daily" && mode !== "diet") {
    return jsonResp({ success: false, recipes: [], error: "Invalid mode parameter" }, 400);
  }
  if (!Array.isArray(ingredients)) {
    return jsonResp({ success: false, recipes: [], error: "Invalid ingredients format" }, 400);
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
    if (!text) throw new Error("DeepSeek returned no content");

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
      ? "Insufficient API credits. Please top up at platform.deepseek.com and try again"
      : raw.includes("DEEPSEEK_API_KEY not configured")
      ? "Please configure DEEPSEEK_API_KEY in .env.local"
      : raw.includes("rate limit") || raw.includes("overloaded")
      ? "Too many requests, please wait a few seconds and try again"
      : "Generation failed, please try again later";
    return jsonResp({ success: false, recipes: [], error: msg }, 500);
  }
}
