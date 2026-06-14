import { REST_ACTIVITY_LABELS, REST_ANCHORS, WorldAnchor } from "./officeAnchors";
import { EmployeeConfig, MovementTarget } from "./types";

/** 默认朝 -Z；根据位移计算面朝方向（修复倒着走） */
export function walkFacing(dx: number, dz: number): number {
  if (Math.hypot(dx, dz) < 0.001) return 0;
  return Math.atan2(dx, -dz);
}

export function lerpAngle(cur: number, target: number, k: number): number {
  let diff = target - cur;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return cur + diff * k;
}

function walkStep(
  x: number,
  z: number,
  fromX: number,
  fromZ: number,
  text: string
): MovementTarget {
  return {
    x,
    z,
    rotation: walkFacing(x - fromX, z - fromZ),
    finalStatus: "walking",
    text,
  };
}

/** 去会议室：先汇入中央走廊，再东行，避免斜穿卡死 */
export function buildMeetingPath(
  emp: EmployeeConfig,
  index: number,
  anchor: WorldAnchor
): MovementTarget[] {
  const spread = ((index % 5) - 2) * 0.5;
  const deskX = emp.position[0];
  const deskZ = emp.position[2];
  const chain: MovementTarget[] = [];
  let fromX = deskX;
  let fromZ = deskZ;

  if (Math.abs(deskZ) > 1.0) {
    const wp = walkStep(deskX + spread * 0.35, 0, fromX, fromZ, "🚶 去会议室…");
    chain.push(wp);
    fromX = wp.x;
    fromZ = wp.z;
  }

  if (anchor.x > 10) {
    const east = walkStep(11.5 + spread, 0, fromX, fromZ, "🚶 去会议室…");
    chain.push(east);
    fromX = east.x;
    fromZ = east.z;

    const inlet = walkStep(11.7 + spread * 0.4, anchor.z, fromX, fromZ, "🚶 去会议室…");
    chain.push(inlet);
    fromX = inlet.x;
    fromZ = inlet.z;
  }

  chain.push({
    x: anchor.x,
    z: anchor.z,
    rotation: anchor.rotation,
    finalStatus: "focusing",
    text: "🎯 专注会议中",
  });
  return chain;
}

/** 去休息区：先走廊，再西行 */
export function buildBreakPath(
  emp: EmployeeConfig,
  index: number,
  anchor: (typeof REST_ANCHORS)[number]
): MovementTarget[] {
  const spread = ((index % 5) - 2) * 0.5;
  const deskX = emp.position[0];
  const deskZ = emp.position[2];
  const chain: MovementTarget[] = [];
  let fromX = deskX;
  let fromZ = deskZ;

  if (Math.abs(deskZ) > 1.0) {
    const wp = walkStep(deskX + spread * 0.35, 0, fromX, fromZ, "🚶 去休息区…");
    chain.push(wp);
    fromX = wp.x;
    fromZ = wp.z;
  }

  if (anchor.x < -10) {
    const west = walkStep(-11.5 + spread, 0, fromX, fromZ, "🚶 去休息区…");
    chain.push(west);
    fromX = west.x;
    fromZ = west.z;

    const inlet = walkStep(-11.7 + spread * 0.4, anchor.z, fromX, fromZ, "🚶 去休息区…");
    chain.push(inlet);
    fromX = inlet.x;
    fromZ = inlet.z;
  }

  chain.push({
    x: anchor.x,
    z: anchor.z,
    rotation: anchor.rotation,
    finalStatus: "resting",
    restActivity: anchor.activity,
    text: REST_ACTIVITY_LABELS[anchor.activity],
  });
  return chain;
}

/** 回工位：先走廊再入座 */
export function buildDeskPathFrom(
  emp: EmployeeConfig,
  index: number,
  fromX: number,
  fromZ: number
): MovementTarget[] {
  const spread = ((index % 5) - 2) * 0.4;
  const deskX = emp.position[0];
  const deskZ = emp.position[2];
  const chain: MovementTarget[] = [];
  let cx = fromX;
  let cz = fromZ;

  if (Math.abs(deskZ) > 1.0 && Math.abs(cz) > 1.0) {
    const wp = walkStep(deskX + spread * 0.3, 0, cx, cz, "🚶 回工位…");
    chain.push(wp);
    cx = wp.x;
    cz = wp.z;
  }

  if (Math.hypot(deskX - cx, deskZ - cz) > 0.8) {
    chain.push(walkStep(deskX, deskZ, cx, cz, "🚶 回工位…"));
  }

  chain.push({
    x: deskX,
    z: deskZ,
    rotation: emp.rotation,
    finalStatus: "idle",
  });
  return chain;
}
