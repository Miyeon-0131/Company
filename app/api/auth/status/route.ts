import { NextResponse } from "next/server";
import { googleConfigured, readAuthFromRequest } from "@/lib/server/google";

export const runtime = "nodejs";

/** 返回当前 Gmail 登录状态 */
export function GET(req: Request) {
  const auth = readAuthFromRequest(req);
  return NextResponse.json({
    configured: googleConfigured(),
    email: auth?.email ?? null,
  });
}
