import { NextResponse } from "next/server";
import { EMPLOYEES } from "@/lib/employees";
import { planWithRules } from "@/lib/planner";
import { chatClaude, extractJsonObject } from "@/lib/server/llm";
import { SubTask } from "@/lib/types";

/**
 * 项目经理（Task Manager）API：
 * 将老板的自然语言指令拆解为子任务依赖图（DAG）。
 * 配置了 CLAUDE_API_KEY 时调用 Claude，否则使用本地规则引擎。
 */
export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "指令不能为空" }, { status: 400 });
  }

  if (process.env.CLAUDE_API_KEY) {
    try {
      const tasks = await planWithClaude(prompt);
      return NextResponse.json({ source: "llm", tasks });
    } catch (err) {
      console.error("[plan] Claude 拆解失败，降级为规则引擎:", err);
    }
  }

  return NextResponse.json({ source: "mock", tasks: planWithRules(prompt) });
}

async function planWithClaude(prompt: string): Promise<SubTask[]> {
  const roster = EMPLOYEES.map(
    (e) => `- ${e.id}（${e.name}）：${e.jobDescription}`
  ).join("\n");

  const raw = await chatClaude(
    `你是一家虚拟公司的项目经理，负责把老板的指令拆解为子任务依赖图（DAG）。
公司员工花名册（employeeId 必须严格取自下表）：
${roster}

要求：
1. 只挑选与指令相关的员工，能并行的任务不要加依赖；
2. 信息收集在最前，交付类任务（PDF、邮件）在最后；
3. title 用简体中文、以一个贴切的 emoji 开头、不超过 14 个字；
4. 只输出 JSON，不要其他文字：{"tasks":[{"id":"t1","employeeId":"...","title":"...","dependsOn":[]}]}，
   id 形如 t1/t2/t3，dependsOn 只能引用已有 id 且不得成环。`,
    prompt
  );

  const parsed = extractJsonObject<{
    tasks: Array<Omit<SubTask, "status">>;
  }>(raw);

  const validIds = new Set(EMPLOYEES.map((e) => e.id));
  const tasks: SubTask[] = (parsed.tasks ?? [])
    .filter((t) => validIds.has(t.employeeId) && t.id && t.title)
    .map((t) => ({
      id: t.id,
      employeeId: t.employeeId,
      title: t.title,
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
      status: "pending" as const,
    }));

  const taskIds = new Set(tasks.map((t) => t.id));
  tasks.forEach((t) => {
    t.dependsOn = t.dependsOn.filter((d) => taskIds.has(d));
  });

  if (!tasks.length) throw new Error("Claude 返回的任务列表为空或不合法");
  return tasks;
}
