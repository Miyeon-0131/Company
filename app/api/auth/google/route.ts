import { NextResponse } from "next/server";
import { buildAuthUrl, googleConfigured } from "@/lib/server/google";

export const runtime = "nodejs";

/** 跳转到 Google 授权同意页 */
export function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "未配置 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" },
      { status: 500 }
    );
  }
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(buildAuthUrl(origin));
}
