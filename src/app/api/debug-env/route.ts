import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";

  let queryResult: unknown = "not attempted";
  if (url && key) {
    try {
      const sb = createClient(url, key);
      const { data, error } = await sb.from("invite_codes").select("code");
      queryResult = { data, error };
    } catch (e) {
      queryResult = { thrown: String(e) };
    }
  }

  return Response.json({
    hasSupabaseUrl: !!url,
    hasSupabaseKey: !!key,
    supabaseUrlPrefix: url.slice(0, 35),
    queryResult,
  });
}
