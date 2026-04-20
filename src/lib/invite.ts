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

function parseCodeMap(): Record<string, number> {
  const raw = process.env.INVITE_CODES ?? "";
  const map: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const parts = entry.trim().split(":");
    if (parts.length === 2 && parts[0] && parts[1]) {
      map[parts[0].trim().toUpperCase()] = Number(parts[1]);
    }
  }
  return map;
}

// Just validate — no counting. Called when user enters the invite code.
export function checkCodeValid(code: string): boolean {
  const codeMap = parseCodeMap();
  return code.trim().toUpperCase() in codeMap;
}

// Increment usage — called on each recipe generation.
export async function consumeOneUse(code: string): Promise<CodeResult> {
  const codeMap = parseCodeMap();
  const upper = code.trim().toUpperCase();
  const maxUses = codeMap[upper];

  if (maxUses === undefined) {
    return { valid: false, error: "邀请码无效" };
  }

  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.rpc("use_invite_code", {
      p_code: upper,
      p_max: maxUses,
    });

    if (error) {
      console.error("[invite] Supabase error:", error);
      return { valid: false, error: "服务器错误，请重试" };
    }

    if (data?.error) {
      return { valid: false, error: data.error };
    }

    return { valid: true, remaining: maxUses - (data?.used ?? maxUses) };
  } else {
    // In-memory fallback
    const used = (inMemory.get(upper) ?? 0) + 1;
    if (used > maxUses) {
      return { valid: false, error: "邀请码已达使用上限" };
    }
    inMemory.set(upper, used);
    return { valid: true, remaining: maxUses - used };
  }
}
