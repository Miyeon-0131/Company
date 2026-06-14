import { create } from "zustand";
import { IDLE_ACTIVITY_LABELS } from "./idleActivity";
import { IdleChatterTurn } from "./idleChatter";
import {
  MEETING_ANCHORS,
  REST_ANCHORS,
} from "./officeAnchors";
import {
  buildBreakPath,
  buildDeskPathFrom,
  buildMeetingPath,
  lerpAngle,
  walkFacing,
} from "./movement";
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

function toDurationSeconds(parts: DurationParts): number {
  return Math.max(0, parts.hours * 3600 + parts.minutes * 60 + parts.seconds);
}

interface OfficeState {
  statuses: Record<string, AgentStatus>;
  statusTexts: Record<string, string | null>;
  employeePoses: Record<string, EmployeePose>;
  movementTargets: Record<string, MovementTarget | null>;
  movementQueues: Record<string, MovementTarget[]>;
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

  startFocusSession: (focus: DurationParts) => void;
  startBreakSession: (breakTime: DurationParts) => void;
  stopOfficeMode: () => void;
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

function assignMovementChain(
  targets: Record<string, MovementTarget | null>,
  queues: Record<string, MovementTarget[]>,
  employeeId: string,
  chain: MovementTarget[]
) {
  if (!chain.length) return;
  targets[employeeId] = chain[0]!;
  queues[employeeId] = chain.slice(1);
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  statuses: { ...initialStatuses },
  statusTexts: {},
  employeePoses: initialPoses(),
  movementTargets: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
  movementQueues: Object.fromEntries(EMPLOYEES.map((e) => [e.id, []])),
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
    const nextQueues = { ...state.movementQueues };
    const nextRest = { ...state.restActivities };

    for (const emp of EMPLOYEES) {
      const target = state.movementTargets[emp.id];
      if (!target) continue;

      const pose = nextPoses[emp.id]!;
      const dx = target.x - pose.x;
      const dz = target.z - pose.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= ARRIVE_DIST) {
        const queue = nextQueues[emp.id] ?? [];
        if (queue.length > 0) {
          nextTargets[emp.id] = queue[0]!;
          nextQueues[emp.id] = queue.slice(1);
          nextStatuses[emp.id] = "walking";
          nextTexts[emp.id] = queue[0]!.text ?? "🚶 赶路中…";
          changed = true;
          continue;
        }

        nextPoses[emp.id] = {
          x: target.x,
          z: target.z,
          rotation: target.rotation,
        };
        nextStatuses[emp.id] = target.finalStatus;
        nextTexts[emp.id] = target.text ?? null;
        nextTargets[emp.id] = null;
        nextQueues[emp.id] = [];
        nextRest[emp.id] = target.restActivity ?? null;
        changed = true;
        continue;
      }

      const step = WALK_SPEED * dt;
      const ratio = Math.min(1, step / dist);
      const nextX = pose.x + dx * ratio;
      const nextZ = pose.z + dz * ratio;
      const face = walkFacing(nextX - pose.x || dx, nextZ - pose.z || dz);
      nextPoses[emp.id] = {
        x: nextX,
        z: nextZ,
        rotation: lerpAngle(pose.rotation, face, 0.22),
      };
      if (nextStatuses[emp.id] !== "walking") {
        nextStatuses[emp.id] = "walking";
        nextTexts[emp.id] = target.text ?? "🚶 赶路中…";
      }
      changed = true;
    }

    if (changed) {
      set({
        employeePoses: nextPoses,
        statuses: nextStatuses,
        statusTexts: nextTexts,
        movementTargets: nextTargets,
        movementQueues: nextQueues,
        restActivities: nextRest,
      });
    }
  },

  dispatchAllToMeeting: () => {
    const s = get();
    s.setIdleChatter(null);
    const targets = { ...s.movementTargets };
    const queues = { ...s.movementQueues };
    EMPLOYEES.forEach((emp, i) => {
      const anchor = MEETING_ANCHORS[i % MEETING_ANCHORS.length]!;
      assignMovementChain(
        targets,
        queues,
        emp.id,
        buildMeetingPath(emp, i, anchor)
      );
    });
    set({
      movementTargets: targets,
      movementQueues: queues,
      restActivities: Object.fromEntries(EMPLOYEES.map((e) => [e.id, null])),
    });
    EMPLOYEES.forEach((e) => s.setStatus(e.id, "walking", "🚶 去会议室…"));
    s.addLog("系统", "全员前往会议室，进入专注时间", "system");
  },

  dispatchAllToBreak: () => {
    const s = get();
    s.setIdleChatter(null);
    const targets = { ...s.movementTargets };
    const queues = { ...s.movementQueues };
    EMPLOYEES.forEach((emp, i) => {
      const anchor = REST_ANCHORS[i % REST_ANCHORS.length]!;
      assignMovementChain(targets, queues, emp.id, buildBreakPath(emp, i, anchor));
    });
    set({ movementTargets: targets, movementQueues: queues });
    EMPLOYEES.forEach((e) => s.setStatus(e.id, "walking", "🚶 去休息区…"));
    s.addLog("系统", "全员前往休息区", "system");
  },

  returnAllToDesks: () => {
    const s = get();
    const targets = { ...s.movementTargets };
    const queues = { ...s.movementQueues };
    EMPLOYEES.forEach((emp, i) => {
      const pose = s.employeePoses[emp.id]!;
      assignMovementChain(
        targets,
        queues,
        emp.id,
        buildDeskPathFrom(emp, i, pose.x, pose.z)
      );
    });
    set({
      movementTargets: targets,
      movementQueues: queues,
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

  startFocusSession: (focus) => {
    const focusSec = Math.max(1, toDurationSeconds(focus));
    set({
      officeMode: "focus",
      focusDurationSec: focusSec,
      modeRemainingSec: focusSec,
    });
    get().dispatchAllToMeeting();
  },

  startBreakSession: (breakTime) => {
    const breakSec = Math.max(1, toDurationSeconds(breakTime));
    set({
      officeMode: "break",
      breakDurationSec: breakSec,
      modeRemainingSec: breakSec,
    });
    get().dispatchAllToBreak();
  },

  stopOfficeMode: () => {
    if (get().officeMode === "normal") return;
    const mode = get().officeMode;
    get().returnAllToDesks();
    get().addLog(
      "系统",
      mode === "focus" ? "专注模式已结束" : "休息模式已结束",
      "system"
    );
  },

  tickModeTimer: () => {
    const s = get();
    if (s.officeMode === "normal" || s.modeRemainingSec <= 0) return;
    const next = s.modeRemainingSec - 1;
    if (next > 0) {
      set({ modeRemainingSec: next });
      return;
    }
    const mode = s.officeMode;
    get().returnAllToDesks();
    get().addLog(
      "系统",
      mode === "focus" ? "专注时间结束，回到工位" : "休息时间结束，回到工位",
      "system"
    );
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
