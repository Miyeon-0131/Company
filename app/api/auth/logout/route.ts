import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/server/google";

export const runtime = "nodejs";

/** 退出邮箱登录：清除 cookie */
export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
