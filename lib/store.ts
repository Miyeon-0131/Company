import { create } from "zustand";
import { AgentStatus, LogEntry, Mission, ScreenEntry, SubTask } from "./types";
import { EMPLOYEES } from "./employees";

const STATUS_CYCLE: AgentStatus[] = ["idle", "thinking", "working", "done"];

let logId = 0;
let screenId = 0;
const now = () =>
  new Date().toLocaleTimeString("zh-CN", { hour12: false });

interface OfficeState {
  /** 每个员工的实时状态（驱动 3D 动画） */
  statuses: Record<string, AgentStatus>;
  /** 头顶气泡的覆盖文案（由 Task Manager 下发） */
  statusTexts: Record<string, string | null>;
  /** 当前任务（含拆解出的子任务依赖图） */
  mission: Mission | null;
  /** 指令终端日志流 */
  logs: LogEntry[];
  /** 是否弹出最终交付报告 */
  showResult: boolean;
  /** 每个员工的"电脑屏幕"内容（工作记录 + 可点击链接） */
  screens: Record<string, ScreenEntry[]>;
  /** 当前正在查看哪个员工的屏幕（null = 关闭面板） */
  activeScreen: string | null;

  setStatus: (employeeId: string, status: AgentStatus, text?: string) => void;
  /** Step 4 核心 API：给某员工分配任务（状态置为 working 并更新气泡文案） */
  assignTask: (employeeId: string, task: string) => void;
  /** 调试用：点击员工循环切换状态（任务执行中禁用） */
  cycleStatus: (employeeId: string) => void;

  startMission: (prompt: string) => void;
  setMissionTasks: (tasks: SubTask[], source: "llm" | "mock") => void;
  updateTask: (taskId: string, patch: Partial<SubTask>) => void;
  finishMission: (finalReport: string) => void;

  addLog: (source: string, text: string, kind?: LogEntry["kind"]) => void;
  addScreen: (
    employeeId: string,
    entry: Omit<ScreenEntry, "id" | "time">
  ) => void;
  setActiveScreen: (employeeId: string | null) => void;
  setShowResult: (show: boolean) => void;
  resetAll: () => void;
}

const initialStatuses = Object.fromEntries(
  EMPLOYEES.map((e) => [e.id, "idle" as AgentStatus])
);

export const useOfficeStore = create<OfficeState>((set, get) => ({
  statuses: { ...initialStatuses },
  statusTexts: {},
  mission: null,
  logs: [],
  showResult: false,
  screens: {},
  activeScreen: null,

  setStatus: (employeeId, status, text) =>
    set((state) => ({
      statuses: { ...state.statuses, [employeeId]: status },
      statusTexts: { ...state.statusTexts, [employeeId]: text ?? null },
    })),

  assignTask: (employeeId, task) => {
    get().setStatus(employeeId, "working", task);
    const employee = EMPLOYEES.find((e) => e.id === employeeId);
    get().addLog(employee?.name ?? employeeId, `开始执行：${task}`, "agent");
  },

  cycleStatus: (employeeId) => {
    const mission = get().mission;
    if (mission && mission.status !== "done") return; // 任务执行中禁止手动切换
    set((state) => {
      const current = state.statuses[employeeId] ?? "idle";
      const next =
        STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
      return {
        statuses: { ...state.statuses, [employeeId]: next },
        statusTexts: { ...state.statusTexts, [employeeId]: null },
      };
    });
  },

  startMission: (prompt) =>
    set({
      mission: {
        id: `m-${Date.now()}`,
        prompt,
        status: "planning",
        tasks: [],
      },
      showResult: false,
    }),

  setMissionTasks: (tasks, source) =>
    set((state) =>
      state.mission
        ? {
            mission: {
              ...state.mission,
              status: "running",
              tasks,
              plannerSource: source,
            },
          }
        : {}
    ),

  updateTask: (taskId, patch) =>
    set((state) =>
      state.mission
        ? {
            mission: {
              ...state.mission,
              tasks: state.mission.tasks.map((t) =>
                t.id === taskId ? { ...t, ...patch } : t
              ),
            },
          }
        : {}
    ),

  finishMission: (finalReport) =>
    set((state) =>
      state.mission
        ? {
            mission: { ...state.mission, status: "done", finalReport },
            showResult: true,
          }
        : {}
    ),

  addLog: (source, text, kind = "system") =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-99), // 最多保留 100 条
        { id: ++logId, time: now(), source, text, kind },
      ],
    })),

  addScreen: (employeeId, entry) =>
    set((state) => ({
      screens: {
        ...state.screens,
        [employeeId]: [
          ...(state.screens[employeeId] ?? []).slice(-59), // 每屏最多 60 条
          { ...entry, id: ++screenId, time: now() },
        ],
      },
    })),

  setActiveScreen: (employeeId) => set({ activeScreen: employeeId }),

  setShowResult: (show) => set({ showResult: show }),

  resetAll: () =>
    set({
      statuses: { ...initialStatuses },
      statusTexts: {},
      mission: null,
      showResult: false,
      screens: {},
    }),
}));
