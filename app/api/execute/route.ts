import { NextResponse } from "next/server";
import { readAuthFromRequest } from "@/lib/server/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Worker Agent 执行入口：在服务端调用真实工具（搜索/GitHub/生成文件/发邮件） */
export async function POST(req: Request) {
  let body: {
    employeeId: string;
    prompt: string;
    inputs?: { summary: string; payload?: unknown }[];
    missionId: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  if (!body.employeeId || !body.prompt || !/^[\w-]+$/.test(body.missionId ?? "")) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  try {
    const { executeTool } = await import("@/lib/server/tools");
    const result = await executeTool(body.employeeId, {
      prompt: body.prompt,
      inputs: body.inputs ?? [],
      missionId: body.missionId,
      gmailAuth: readAuthFromRequest(req),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[execute] ${body.employeeId} 执行失败:`, err);
    return NextResponse.json(
      { summary: `执行异常（${message}），已跳过该环节`, mode: "mock" },
      { status: 200 }
    );
  }
}
