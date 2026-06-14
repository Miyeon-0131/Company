import { RestActivity } from "./types";
import {
  backVector,
  facingFromDelta,
  seatRootAt,
} from "./characterFacing";
import {
  MEETING_LONG_SIDE_Z,
  MEETING_SHORT_CHAIRS,
  MEETING_SIDE_X,
} from "./meetingLayout";

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

/** 最后一段路径：先走到椅后更远一点再就位 */
export const APPROACH_BEHIND = 0.85;

function meetWorld(localX: number, localZ: number, rotation: number): WorldAnchor {
  return { x: MC + localX, z: localZ, rotation };
}

function breakWorld(localX: number, localZ: number, rotation: number): WorldAnchor {
  return { x: BC + localX, z: localZ, rotation };
}

/** 会议椅：眼睛面朝桌面（长边侧向朝桌，短边朝桌心） */
function meetingFaceRotation(chairX: number, chairZ: number): number {
  if (chairX < -0.5) return Math.PI / 2;
  if (chairX > 0.5) return -Math.PI / 2;
  return facingFromDelta(0 - chairX, 0.4 - chairZ);
}

/** 会议椅落座：椅心为身体落点，反算 root（同工位逻辑） */
function meetSeatAtChair(chairX: number, chairZ: number): WorldAnchor {
  const rotation = meetingFaceRotation(chairX, chairZ);
  const root = seatRootAt(chairX, chairZ, rotation);
  return meetWorld(root.x, root.z, root.rotation);
}

/** 椅后预就位：沿背部再远一点，目视前方走向落座点 */
export function approachPointBehind(anchor: WorldAnchor): WorldAnchor {
  const back = backVector(anchor.rotation);
  return {
    x: anchor.x + back.x * APPROACH_BEHIND,
    z: anchor.z + back.z * APPROACH_BEHIND,
    rotation: anchor.rotation,
  };
}

/** 会议室 10 椅：长边各 4（等间距）+ 短边各 1 */
export const MEETING_ANCHORS: WorldAnchor[] = [
  ...MEETING_LONG_SIDE_Z.map((z) => meetSeatAtChair(-MEETING_SIDE_X, z)),
  ...MEETING_LONG_SIDE_Z.map((z) => meetSeatAtChair(MEETING_SIDE_X, z)),
  meetSeatAtChair(MEETING_SHORT_CHAIRS[0]!.x, MEETING_SHORT_CHAIRS[0]!.z),
  meetSeatAtChair(MEETING_SHORT_CHAIRS[1]!.x, MEETING_SHORT_CHAIRS[1]!.z),
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
