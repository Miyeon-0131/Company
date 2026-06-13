import { NextResponse } from "next/server";
import { executeTool, ExecContext } from "@/lib/server/tools";
import { readAuthFromRequest } from "@/lib/server/google";

export const runtime = "nodejs";

/** Worker Agent 执行入口：在服务端调用真实工具（搜索/GitHub/生成文件/发邮件） */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    employeeId: string;
    prompt: string;
    inputs?: ExecContext["inputs"];
    missionId: string;
  };

  if (!body.employeeId || !body.prompt || !/^[\w-]+$/.test(body.missionId ?? "")) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  try {
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
      { status: 200 } // 返回 200 让流水线继续，不中断整个任务
    );
  }
}
