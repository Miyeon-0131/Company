import { useOfficeStore } from "./store";
import { EMPLOYEES } from "./employees";
import { planWithRules } from "./planner";
import { Artifact, SubTask } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = () => useOfficeStore.getState();

interface ExecResult {
  summary: string;
  payload?: unknown;
  artifacts?: Artifact[];
  mode: "real" | "mock";
}

let missionRunning = false;

/**
 * AgentManager：一次全局任务的完整生命周期。
 * 用户指令 → 项目经理拆解（Claude/规则） → 按依赖图并行调度员工
 * → 服务端真实执行 → 交付报告弹窗。
 */
export async function runMission(prompt: string) {
  if (missionRunning) return;
  missionRunning = true;

  try {
    const s = store();
    const wasOfficeMode = s.officeMode !== "normal";
    const awayFromDesk = EMPLOYEES.some((e) => {
      const pose = s.employeePoses[e.id];
      if (!pose) return false;
      return (
        Math.hypot(pose.x - e.position[0], pose.z - e.position[2]) > 0.55
      );
    });

    s.resetAll();
    if (wasOfficeMode || awayFromDesk) {
      s.returnAllToDesks();
      s.addLog("系统", "老板有令，全员回工位待命", "system");
    }
    s.startMission(prompt);
    const missionId = store().mission!.id;
    s.addLog("CEO", prompt, "system");
    s.addLog("项目经理", "已接收指令，正在拆解任务依赖图...", "manager");

    let tasks: SubTask[];
    let source: "llm" | "mock" = "mock";
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      tasks = data.tasks;
      source = data.source;
    } catch {
      tasks = planWithRules(prompt);
    }

    store().setMissionTasks(tasks, source);
    store().addLog(
      "项目经理",
      `拆解完成（${source === "llm" ? "Claude 智能拆解" : "规则引擎"}）：共 ${tasks.length} 个子任务，开始分发`,
      "manager"
    );
    await sleep(600);

    const promises = new Map<string, Promise<ExecResult>>();
    const getTaskPromise = (task: SubTask): Promise<ExecResult> => {
      if (!promises.has(task.id)) {
        promises.set(
          task.id,
          executeTask(task, prompt, missionId, tasks, getTaskPromise)
        );
      }
      return promises.get(task.id)!;
    };
    await Promise.all(tasks.map(getTaskPromise));

    const finalTasks = store().mission?.tasks ?? tasks;
    const report = finalTasks
      .map((t) => {
        const name =
          EMPLOYEES.find((e) => e.id === t.employeeId)?.name ?? t.employeeId;
        return `【${name}】${t.output ?? "（无产出）"}`;
      })
      .join("\n");
    store().finishMission(report);
    store().addLog("系统", "✅ 全部子任务完成，交付报告已生成", "done");
  } finally {
    missionRunning = false;
  }
}

/** 收集某任务的全部上游任务（沿依赖图递归，保持原任务顺序） */
function collectUpstream(task: SubTask, allTasks: SubTask[]): SubTask[] {
  const ids = new Set<string>();
  const walk = (t: SubTask) => {
    t.dependsOn.forEach((id) => {
      if (ids.has(id)) return;
      ids.add(id);
      const dep = allTasks.find((x) => x.id === id);
      if (dep) walk(dep);
    });
  };
  walk(task);
  return allTasks.filter((t) => ids.has(t.id));
}

async function executeTask(
  task: SubTask,
  prompt: string,
  missionId: string,
  allTasks: SubTask[],
  getTaskPromise: (t: SubTask) => Promise<ExecResult>
): Promise<ExecResult> {
  // 等待全部上游链路完成，收集所有产出（保证文档类员工拿到原始数据）
  const deps = collectUpstream(task, allTasks);
  const depResults = await Promise.all(deps.map(getTaskPromise));
  const inputs = depResults.map((r) => ({ summary: r.summary, payload: r.payload }));

  const employee = EMPLOYEES.find((e) => e.id === task.employeeId);
  const name = employee?.name ?? task.employeeId;

  store().updateTask(task.id, { status: "thinking" });
  store().setStatus(task.employeeId, "thinking");
  store().addLog("项目经理", `→ 已派单给【${name}】：${task.title}`, "manager");
  store().addScreen(task.employeeId, {
    kind: "action",
    text: `📥 接到任务：${task.title}`,
  });
  await sleep(800 + Math.random() * 600);

  store().updateTask(task.id, { status: "running" });
  store().assignTask(task.employeeId, task.title);
  store().addScreen(task.employeeId, {
    kind: "action",
    text: `⚙️ 正在执行（已获取 ${inputs.length} 份上游材料）...`,
  });
  let result: ExecResult;
  try {
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: task.employeeId,
        prompt,
        inputs,
        missionId,
      }),
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        `API 返回非 JSON（HTTP ${res.status}）：${text.replace(/\s+/g, " ").slice(0, 100)}`
      );
    }
    result = await res.json();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    result = {
      summary: `网络异常（${err instanceof Error ? err.message : err}），该环节已跳过`,
      mode: "mock",
    };
  }

  // 把产出写到该员工的"电脑屏幕"：摘要 + 可点击网页 + 可下载文件
  store().addScreen(task.employeeId, { kind: "result", text: result.summary });
  if (Array.isArray(result.payload)) {
    (result.payload as Array<Record<string, unknown>>)
      .slice(0, 8)
      .forEach((p) => {
        const url = typeof p.url === "string" ? p.url : undefined;
        if (!url) return;
        const title =
          (typeof p.title === "string" && p.title) ||
          (typeof p.fullName === "string" && p.fullName) ||
          url;
        store().addScreen(task.employeeId, { kind: "link", text: title, url });
      });
  }
  store().cacheArtifacts(result.artifacts);
  result.artifacts?.forEach((a) =>
    store().addScreen(task.employeeId, {
      kind: "artifact",
      text: a.name,
      url: a.url,
    })
  );

  store().updateTask(task.id, {
    status: "done",
    output: result.summary,
    artifacts: result.artifacts?.map(({ name, url, mimeType }) => ({
      name,
      url,
      mimeType,
    })),
    mode: result.mode,
  });
  store().setStatus(task.employeeId, "done");
  store().addLog(name, result.summary, "done");
  setTimeout(() => {
    const current = useOfficeStore.getState();
    if (current.statuses[task.employeeId] === "done") {
      current.setStatus(task.employeeId, "idle");
    }
  }, 2600);

  return result;
}
