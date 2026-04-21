import { checkCodeValid } from "@/lib/invite";

export async function POST(request: Request) {
  let code: string;
  try {
    const body = await request.json();
    code = String(body.code ?? "");
  } catch {
    return Response.json({ success: false, error: "请求格式错误" }, { status: 400 });
  }

  if (!code.trim()) {
    return Response.json({ success: false, error: "请输入邀请码" }, { status: 400 });
  }

  const valid = await checkCodeValid(code);
  if (!valid) {
    return Response.json({ success: false, error: "邀请码无效" }, { status: 403 });
  }

  const upper = code.trim().toUpperCase();
  const res = Response.json({ success: true });
  // Store which code this session is using (30 days)
  res.headers.set(
    "Set-Cookie",
    `fridge_auth=${upper}; Path=/; Max-Age=${30 * 24 * 3600}; SameSite=Lax; HttpOnly`
  );
  return res;
}
