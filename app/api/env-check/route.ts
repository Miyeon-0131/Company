import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 检查服务端环境变量是否已注入（不暴露具体值） */
export async function GET() {
  return NextResponse.json({
    claude: !!process.env.CLAUDE_API_KEY?.trim(),
    tavily: !!process.env.TAVILY_API_KEY?.trim(),
    openai: !!process.env.OPENAI_API_KEY?.trim(),
    github: !!process.env.GITHUB_TOKEN?.trim(),
    googleOAuth: !!(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
    ),
    smtp: !!(
      process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
    ),
  });
}
