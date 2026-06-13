import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  emailFromIdToken,
  encodeAuthCookie,
  exchangeCode,
} from "@/lib/server/google";

export const runtime = "nodejs";

/** Google 回调：用授权码换 token，存入 httpOnly cookie 后回到首页 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=denied`);
  }

  try {
    const token = await exchangeCode(code, origin);
    const email = emailFromIdToken(token.id_token);
    if (!token.refresh_token) {
      // 用户之前已授权过、Google 未返回 refresh_token：撤销后重试
      return NextResponse.redirect(`${origin}/?auth=norefresh`);
    }
    const res = NextResponse.redirect(`${origin}/?auth=ok`);
    res.cookies.set(
      AUTH_COOKIE,
      encodeAuthCookie({ email, refreshToken: token.refresh_token }),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    );
    return res;
  } catch (err) {
    console.error("[auth/google/callback]", err);
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
}
