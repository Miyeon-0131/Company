import { RestActivity } from "./types";

export const MEETING_CENTER: [number, number, number] = [15.2, 0, 0];
export const BREAK_CENTER: [number, number, number] = [-15.2, 0, 0];

export interface WorldAnchor {
  x: number;
  z: number;
  rotation: number;
}

export interface RestAnchor extends WorldAnchor {
  activity: RestActivity;
}

const MC = MEETING_CENTER[0];
const BC = BREAK_CENTER[0];

/** 落座/就位时，人站在椅子靠背正后方（朝桌面/家具方向） */
const BEHIND_CHAIR = 0.58;
/** 最后一段路径：先走到椅后更远一点再就位 */
export const APPROACH_BEHIND = 0.85;

function meetWorld(localX: number, localZ: number, rotation: number): WorldAnchor {
  return { x: MC + localX, z: localZ, rotation };
}

function breakWorld(localX: number, localZ: number, rotation: number): WorldAnchor {
  return { x: BC + localX, z: localZ, rotation };
}

/**
 * 会议椅后方就位。
 * chairRot 与 MeetingRoom Chair 组件一致；员工面朝桌面。
 */
function behindMeetingChair(
  chairX: number,
  chairZ: number,
  chairRot: number,
  faceRot: number
): WorldAnchor {
  const backX = Math.sin(chairRot);
  const backZ = Math.cos(chairRot);
  return meetWorld(
    chairX - backX * BEHIND_CHAIR,
    chairZ - backZ * BEHIND_CHAIR,
    faceRot
  );
}

/** 椅后预就位点（从该点再走到最终位，避免穿桌/穿椅） */
export function approachPointBehind(anchor: WorldAnchor): WorldAnchor {
  const fx = Math.sin(anchor.rotation);
  const fz = -Math.cos(anchor.rotation);
  return {
    x: anchor.x - fx * APPROACH_BEHIND,
    z: anchor.z - fz * APPROACH_BEHIND,
    rotation: anchor.rotation,
  };
}

/** 会议室 9 椅 + 1 旁听（每人椅背正后方） */
export const MEETING_ANCHORS: WorldAnchor[] = [
  ...[-2.0, -1.2, 0.4, 2.0].map((z) =>
    behindMeetingChair(-1.5, z, -Math.PI / 2, Math.PI / 2)
  ),
  ...[-2.0, -1.2, 0.4, 2.0].map((z) =>
    behindMeetingChair(1.5, z, Math.PI / 2, -Math.PI / 2)
  ),
  behindMeetingChair(0, 3.4, 0, 0),
  meetWorld(0, -2.35, Math.PI),
];

/** 休息区：沙发/设备前方就位 */
export const REST_ANCHORS: RestAnchor[] = [
  { ...breakWorld(0.4, 4.72, Math.PI), activity: "sofa" },
  { ...breakWorld(-0.6, 2.32, 0), activity: "sofa" },
  { ...breakWorld(1.4, 2.32, 0), activity: "sofa" },
  { ...breakWorld(-2.15, -3.35, Math.PI / 2), activity: "coffee" },
  { ...breakWorld(-0.7, -5.55, 0), activity: "vending" },
  { ...breakWorld(0.6, -5.55, 0), activity: "vending" },
  { ...breakWorld(-2.15, 2.45, Math.PI / 2), activity: "water" },
  { ...breakWorld(-2.15, 0.55, Math.PI / 2), activity: "microwave" },
  { ...breakWorld(0.4, 3.05, Math.PI), activity: "lounge" },
  { ...breakWorld(2.0, 4.45, (3 * Math.PI) / 4), activity: "lounge" },
];

export const REST_ACTIVITY_LABELS: Record<RestActivity, string> = {
  sofa: "🛋️ 窝在沙发里",
  coffee: "☕ 泡咖啡中",
  vending: "🥤 挑饮料",
  water: "💧 接杯水",
  microwave: "🍱 热便当",
  lounge: "📖 歇口气",
};
