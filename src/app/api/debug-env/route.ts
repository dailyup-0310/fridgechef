export async function GET() {
  return Response.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    supabaseUrlPrefix: process.env.SUPABASE_URL?.slice(0, 30) ?? "MISSING",
    hasInviteCodes: !!process.env.INVITE_CODES,
    inviteCodesValue: process.env.INVITE_CODES ?? "MISSING",
  });
}
