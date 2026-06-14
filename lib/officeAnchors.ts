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

/** 会议室局部坐标 → 员工站立/落座点（相对椅子朝外偏移，避免穿模） */
function meetSeat(
  localX: number,
  localZ: number,
  rotation: number
): WorldAnchor {
  return { x: MC + localX, z: localZ, rotation };
}

/**
 * 会议室座位：4+4 侧椅 + 主位 + 旁听（10 人）
 */
export const MEETING_ANCHORS: WorldAnchor[] = [
  ...[-2.0, -1.2, 0.4, 2.0].map((z) => meetSeat(-2.05, z, -Math.PI / 2)),
  ...[-2.0, -1.2, 0.4, 2.0].map((z) => meetSeat(2.05, z, Math.PI / 2)),
  meetSeat(0, 3.95, 0),
  meetSeat(0, -2.35, 0),
];

/** 休息区锚点（站在家具前方，不嵌入模型） */
export const REST_ANCHORS: RestAnchor[] = [
  { x: BC + 0.35, z: 4.75, rotation: 0, activity: "sofa" },
  { x: BC - 0.55, z: 2.35, rotation: Math.PI, activity: "sofa" },
  { x: BC + 1.55, z: 2.35, rotation: Math.PI, activity: "sofa" },
  { x: BC - 2.35, z: -3.15, rotation: Math.PI / 2, activity: "coffee" },
  { x: BC - 0.75, z: -5.85, rotation: 0, activity: "vending" },
  { x: BC + 0.55, z: -5.85, rotation: 0, activity: "vending" },
  { x: BC - 2.35, z: 2.45, rotation: Math.PI / 2, activity: "water" },
  { x: BC - 2.35, z: 0.55, rotation: Math.PI / 2, activity: "microwave" },
  { x: BC + 0.35, z: 3.15, rotation: 0, activity: "lounge" },
  { x: BC + 2.15, z: 4.55, rotation: -Math.PI / 4, activity: "lounge" },
];

export const REST_ACTIVITY_LABELS: Record<RestActivity, string> = {
  sofa: "🛋️ 窝在沙发里",
  coffee: "☕ 泡咖啡中",
  vending: "🥤 挑饮料",
  water: "💧 接杯水",
  microwave: "🍱 热便当",
  lounge: "📖 歇口气",
};
