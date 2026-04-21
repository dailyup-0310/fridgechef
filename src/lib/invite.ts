import { createClient } from "@supabase/supabase-js";

const inMemory = new Map<string, number>();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface CodeResult {
  valid: boolean;
  remaining?: number;
  error?: string;
}

// Check if code exists in Supabase invite_codes table
export async function checkCodeValid(code: string): Promise<boolean> {
  const upper = code.trim().toUpperCase();
  const supabase = getSupabase();

  console.log("[invite] checkCodeValid", upper, "supabase:", !!supabase, "url:", !!process.env.SUPABASE_URL, "key:", !!process.env.SUPABASE_SERVICE_KEY);

  if (supabase) {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("code", upper)
      .single();
    console.log("[invite] query result data:", data, "error:", error);
    return !!data;
  }

  // Fallback: check env var
  const raw = process.env.INVITE_CODES ?? "";
  return raw.split(",").some((e) => e.split(":")[0].trim().toUpperCase() === upper);
}

// Consume one use — called on each recipe generation
export async function consumeOneUse(code: string): Promise<CodeResult> {
  const upper = code.trim().toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.rpc("use_invite_code", {
      p_code: upper,
      p_max: 0, // ignored — function reads max from invite_codes table
    });

    if (error) {
      console.error("[invite] Supabase error:", error);
      return { valid: false, error: "服务器错误，请重试" };
    }

    if (data?.error) {
      return { valid: false, error: data.error };
    }

    return { valid: true, remaining: (data?.max ?? 0) - (data?.used ?? 0) };
  }

  // In-memory fallback
  const raw = process.env.INVITE_CODES ?? "";
  const entry = raw.split(",").find((e) => e.split(":")[0].trim().toUpperCase() === upper);
  const maxUses = entry ? Number(entry.split(":")[1]) : 0;
  if (!maxUses) return { valid: false, error: "邀请码无效" };

  const used = (inMemory.get(upper) ?? 0) + 1;
  if (used > maxUses) return { valid: false, error: "邀请码已达使用上限" };
  inMemory.set(upper, used);
  return { valid: true, remaining: maxUses - used };
}
