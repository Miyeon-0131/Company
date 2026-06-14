import { create } from "zustand";
import { IDLE_ACTIVITY_LABELS } from "./idleActivity";
import { IdleChatterTurn } from "./idleChatter";
import {
  MEETING_ANCHORS,
  REST_ACTIVITY_LABELS,
  REST_ANCHORS,
} from "./officeAnchors";
import { durationToSeconds } from "./focusMode";
import { resolveMovement } from "./officeCollision";
import {
  AgentStatus,
  Artifact,
  DurationParts,
  EmployeePose,
  IdleActivity,
  LogEntry,
  Mission,
  MovementTarget,
  OfficeMode,
  RestActivity,
  ScreenEntry,
  SubTask,
} from "./types";
import { EMPLOYEES } from "./employees";

const STATUS_CYCLE: AgentStatus[] = ["idle", "thinking", "working", "done"];
const WALK_SPEED = 3.2;
const ARRIVE_DIST = 0.2;

let logId = 0;
let screenId = 0;
const now = () =>
  new Date().toLocaleTimeString("zh-CN", { hour12: false });

const initialPoses = (): Record<string, EmployeePose> =>
  Object.fromEntries(
    EMPLOYEES.map((e) => [
      e.id,
      { x: e.position[0], z: e.position[2], rotation: e.rotation },
    ])
  );

const initialStatuses = Object.fromEntries(
  EMPLOYEES.map((e) => [e.id, "idle" as AgentStatus])
);

interface OfficeState {
  statuses: Record<string, AgentStatus>;
  statusTexts: Record<string, string | null>;
  employeePoses: Record<string, EmployeePose>;
  movementTargets: Record<string, MovementTarget | null>;
  restActivities: Record<string, RestActivity | null>;
  officeMode: OfficeMode;
  modeRemainingSec: number;
  focusDurationSec: number;
  breakDurationSec: number;
  mission: Mission | null;
  logs: LogEntry[];
  showResult: boolean;
  screens: Record<string, ScreenEntry[]>;
  activeScreen: string | null;
  settingsOpen: boolean;
  artifactCache: Record<string, Artifact>;
  idleChatter: IdleChatterTurn | null;
  /** 工位摸鱼时的动作（喝咖啡、伸懒腰等） */
  idleActivities: Record<string, IdleActivity>;

  setStatus: (employeeId: string, status: AgentStatus, text?: string) => void;
  assignTask: (employeeId: string, task: string) => void;
  cycleStatus: (employeeId: string) => void;
  updateEmployeePose: (employeeId: string, pose: Partial<EmployeePose>) => void;
  setMovementTarget: (employeeId: string, target: MovementTarget | null) => void;
  tickMovement: (dt: number) => void;

  startFocusSession: (focus: DurationParts, breakTime: DurationParts) => void;
  stopOfficeMode: () => void;
  beginBreakPhase: () => void;
  tickModeTimer: () => void;
  dispatchAllToMeeting: () => void;
  dispatchAllToBreak: () => void;
  returnAllToDesks: () => void;

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
  setSettingsOpen: (open: boolean) => void;
  setIdleChatter: (payload: IdleChatterTurn | null) => void;
  setIdleActivity: (employeeId: string, activity: IdleActivity) => void;
  cacheArtifacts: (artifacts: Artifact[] | undefined) => void;
  resetAll: () => void;
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  statuses: { ...initialStatuses },
  statusTexts: {},
  employeePoses: initialPoses(),
  movementTargets: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
  restActivities: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
  officeMode: "normal",
  modeRemainingSec: 0,
  focusDurationSec: 25 * 60,
  breakDurationSec: 5 * 60,
  mission: null,
  logs: [],
  showResult: false,
  screens: {},
  activeScreen: null,
  settingsOpen: false,
  artifactCache: {},
  idleChatter: null,
  idleActivities: Object.fromEntries(
    EMPLOYEES.map((e) => [e.id, "sit" as IdleActivity])
  ),

  setStatus: (employeeId, status, text) =>
    set((state) => ({
      statuses: { ...state.statuses, [employeeId]: status },
      statusTexts: { ...state.statusTexts, [employeeId]: text ?? null },
      idleActivities:
        status !== "idle"
          ? { ...state.idleActivities, [employeeId]: "sit" }
          : state.idleActivities,
    })),

  assignTask: (employeeId, task) => {
    get().setStatus(employeeId, "working", task);
    const employee = EMPLOYEES.find((e) => e.id === employeeId);
    get().addLog(employee?.name ?? employeeId, `开始执行：${task}`, "agent");
  },

  cycleStatus: (employeeId) => {
    const mission = get().mission;
    if (mission && mission.status !== "done") return;
    if (get().officeMode !== "normal") return;
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

  updateEmployeePose: (employeeId, pose) =>
    set((state) => ({
      employeePoses: {
        ...state.employeePoses,
        [employeeId]: { ...state.employeePoses[employeeId]!, ...pose },
      },
    })),

  setMovementTarget: (employeeId, target) =>
    set((state) => ({
      movementTargets: { ...state.movementTargets, [employeeId]: target },
    })),

  tickMovement: (dt) => {
    const state = get();
    let changed = false;
    const nextPoses = { ...state.employeePoses };
    const nextStatuses = { ...state.statuses };
    const nextTexts = { ...state.statusTexts };
    const nextTargets = { ...state.movementTargets };
    const nextRest = { ...state.restActivities };

    for (const emp of EMPLOYEES) {
      const target = state.movementTargets[emp.id];
      if (!target) continue;

      const pose = nextPoses[emp.id]!;
      const dx = target.x - pose.x;
      const dz = target.z - pose.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= ARRIVE_DIST) {
        nextPoses[emp.id] = {
          x: target.x,
          z: target.z,
          rotation: target.rotation,
        };
        nextStatuses[emp.id] = target.finalStatus;
        nextTexts[emp.id] = target.text ?? null;
        nextTargets[emp.id] = null;
        nextRest[emp.id] = target.restActivity ?? null;
        changed = true;
        continue;
      }

      const step = WALK_SPEED * dt;
      const ratio = Math.min(1, step / dist);
      const rawX = pose.x + dx * ratio;
      const rawZ = pose.z + dz * ratio;
      const resolved = resolveMovement(pose.x, pose.z, rawX, rawZ);
      const face = Math.atan2(dx, dz);
      nextPoses[emp.id] = {
        x: resolved.x,
        z: resolved.z,
        rotation: pose.rotation + (face - pose.rotation) * 0.15,
      };
      if (nextStatuses[emp.id] !== "walking") {
        nextStatuses[emp.id] = "walking";
        nextTexts[emp.id] = "🚶 赶路中…";
      }
      changed = true;
    }

    if (changed) {
      set({
        employeePoses: nextPoses,
        statuses: nextStatuses,
        statusTexts: nextTexts,
        movementTargets: nextTargets,
        restActivities: nextRest,
      });
    }
  },

  dispatchAllToMeeting: () => {
    const s = get();
    s.setIdleChatter(null);
    const targets: Record<string, MovementTarget | null> = {};
    EMPLOYEES.forEach((emp, i) => {
      const anchor = MEETING_ANCHORS[i % MEETING_ANCHORS.length]!;
      targets[emp.id] = {
        x: anchor.x,
        z: anchor.z,
        rotation: anchor.rotation,
        finalStatus: "focusing",
        text: "🎯 专注会议中",
      };
    });
    set({
      movementTargets: { ...s.movementTargets, ...targets },
      restActivities: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
    });
    EMPLOYEES.forEach((e) => s.setStatus(e.id, "walking", "🚶 去会议室…"));
    s.addLog("系统", "全员前往会议室，进入专注时间", "system");
  },

  dispatchAllToBreak: () => {
    const s = get();
    s.setIdleChatter(null);
    const targets: Record<string, MovementTarget | null> = {};
    EMPLOYEES.forEach((emp, i) => {
      const anchor = REST_ANCHORS[i % REST_ANCHORS.length]!;
      targets[emp.id] = {
        x: anchor.x,
        z: anchor.z,
        rotation: anchor.rotation,
        finalStatus: "resting",
        restActivity: anchor.activity,
        text: REST_ACTIVITY_LABELS[anchor.activity],
      };
    });
    set({
      movementTargets: { ...s.movementTargets, ...targets },
    });
    EMPLOYEES.forEach((e) => s.setStatus(e.id, "walking", "🚶 去休息区…"));
    s.addLog("系统", "专注结束，全员前往休息区", "system");
  },

  returnAllToDesks: () => {
    const s = get();
    const targets: Record<string, MovementTarget | null> = {};
    EMPLOYEES.forEach((emp) => {
      targets[emp.id] = {
        x: emp.position[0],
        z: emp.position[2],
        rotation: emp.rotation,
        finalStatus: "idle",
      };
    });
    set({
      movementTargets: { ...s.movementTargets, ...targets },
      restActivities: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
      officeMode: "normal",
      modeRemainingSec: 0,
    });
    EMPLOYEES.forEach((e) => {
      if (s.statuses[e.id] !== "working" && s.statuses[e.id] !== "thinking") {
        s.setStatus(e.id, "walking", "🚶 回工位…");
      }
    });
    s.addLog("系统", "全员返回各自工位", "system");
  },

  startFocusSession: (focus, breakTime) => {
    const focusSec = Math.max(1, durationToSeconds(focus));
    const breakSec = Math.max(0, durationToSeconds(breakTime));
    set({
      officeMode: "focus",
      focusDurationSec: focusSec,
      breakDurationSec: breakSec,
      modeRemainingSec: focusSec,
    });
    get().dispatchAllToMeeting();
  },

  beginBreakPhase: () => {
    const breakSec = get().breakDurationSec;
    if (breakSec <= 0) {
      get().returnAllToDesks();
      return;
    }
    set({ officeMode: "break", modeRemainingSec: breakSec });
    get().dispatchAllToBreak();
  },

  stopOfficeMode: () => {
    if (get().officeMode === "normal") return;
    get().returnAllToDesks();
    get().addLog("系统", "专注/休息模式已手动停止", "system");
  },

  tickModeTimer: () => {
    const s = get();
    if (s.officeMode === "normal" || s.modeRemainingSec <= 0) return;
    const next = s.modeRemainingSec - 1;
    if (next > 0) {
      set({ modeRemainingSec: next });
      return;
    }
    if (s.officeMode === "focus") {
      get().beginBreakPhase();
    } else {
      get().returnAllToDesks();
      get().addLog("系统", "休息结束，回到工位摸鱼", "system");
    }
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
        ...state.logs.slice(-99),
        { id: ++logId, time: now(), source, text, kind },
      ],
    })),

  addScreen: (employeeId, entry) =>
    set((state) => ({
      screens: {
        ...state.screens,
        [employeeId]: [
          ...(state.screens[employeeId] ?? []).slice(-59),
          { ...entry, id: ++screenId, time: now() },
        ],
      },
    })),

  setActiveScreen: (employeeId) => set({ activeScreen: employeeId }),

  setShowResult: (show) => set({ showResult: show }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setIdleChatter: (payload) =>
    set({
      idleChatter:
        payload &&
        typeof payload === "object" &&
        "lead" in payload &&
        payload.lead?.speakerId
          ? payload
          : null,
    }),

  setIdleActivity: (employeeId, activity) =>
    set((state) => {
      const label = IDLE_ACTIVITY_LABELS[activity];
      const isIdle = (state.statuses[employeeId] ?? "idle") === "idle";
      return {
        idleActivities: { ...state.idleActivities, [employeeId]: activity },
        statusTexts: isIdle
          ? { ...state.statusTexts, [employeeId]: label }
          : state.statusTexts,
      };
    }),

  cacheArtifacts: (artifacts) =>
    set((state) => {
      if (!artifacts?.length) return state;
      const next = { ...state.artifactCache };
      artifacts.forEach((a) => {
        if (a.dataBase64) next[a.url] = a;
      });
      return { artifactCache: next };
    }),

  resetAll: () =>
    set({
      statuses: { ...initialStatuses },
      statusTexts: {},
      mission: null,
      showResult: false,
      screens: {},
      artifactCache: {},
      idleChatter: null,
      idleActivities: Object.fromEntries(
        EMPLOYEES.map((e) => [e.id, "sit" as IdleActivity])
      ),
    }),
}));
