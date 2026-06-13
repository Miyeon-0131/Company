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

/** 会议室座位（7 椅 + 3 站立位） */
export const MEETING_ANCHORS: WorldAnchor[] = [
  { x: 13.7, z: -1.2, rotation: -Math.PI / 2 },
  { x: 13.7, z: 0.4, rotation: -Math.PI / 2 },
  { x: 13.7, z: 2.0, rotation: -Math.PI / 2 },
  { x: 16.7, z: -1.2, rotation: Math.PI / 2 },
  { x: 16.7, z: 0.4, rotation: Math.PI / 2 },
  { x: 16.7, z: 2.0, rotation: Math.PI / 2 },
  { x: 15.2, z: 3.4, rotation: Math.PI },
  { x: 12.4, z: -3.0, rotation: 0 },
  { x: 15.2, z: -3.0, rotation: 0 },
  { x: 18.0, z: -3.0, rotation: 0 },
];

/** 休息区锚点：沙发、咖啡机、售货机、饮水机等 */
export const REST_ANCHORS: RestAnchor[] = [
  { x: -14.8, z: 4.9, rotation: 0, activity: "sofa" },
  { x: -15.8, z: 2.4, rotation: Math.PI, activity: "sofa" },
  { x: -13.8, z: 2.4, rotation: Math.PI, activity: "sofa" },
  { x: -18.1, z: -3.5, rotation: Math.PI / 2, activity: "coffee" },
  { x: -15.9, z: -6.2, rotation: 0, activity: "vending" },
  { x: -14.6, z: -6.2, rotation: 0, activity: "vending" },
  { x: -18.1, z: 2.6, rotation: Math.PI / 2, activity: "water" },
  { x: -18.1, z: 0.8, rotation: Math.PI / 2, activity: "microwave" },
  { x: -14.8, z: 3.2, rotation: 0, activity: "lounge" },
  { x: -12.9, z: 4.8, rotation: -Math.PI / 4, activity: "lounge" },
];

export const REST_ACTIVITY_LABELS: Record<RestActivity, string> = {
  sofa: "🛋️ 窝在沙发里",
  coffee: "☕ 泡咖啡中",
  vending: "🥤 挑饮料",
  water: "💧 接杯水",
  microwave: "🍱 热便当",
  lounge: "📖 歇口气",
};
