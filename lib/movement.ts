import {
  approachPointBehind,
  REST_ACTIVITY_LABELS,
  REST_ANCHORS,
  WorldAnchor,
} from "./officeAnchors";
import { EmployeeConfig, MovementTarget } from "./types";

/** 默认朝 -Z；根据位移计算面朝方向 */
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

function finalSeat(
  anchor: WorldAnchor,
  status: MovementTarget["finalStatus"],
  text: string,
  extra?: Partial<MovementTarget>
): MovementTarget {
  return {
    x: anchor.x,
    z: anchor.z,
    rotation: anchor.rotation,
    finalStatus: status,
    text,
    ...extra,
  };
}

/** 最后两步：先到椅背正后方外沿，再就位 */
function appendBehindApproach(
  chain: MovementTarget[],
  anchor: WorldAnchor,
  fromX: number,
  fromZ: number,
  walkText: string,
  final: MovementTarget
) {
  const pre = approachPointBehind(anchor);
  chain.push(walkStep(pre.x, pre.z, fromX, fromZ, walkText));
  chain.push(final);
}

/** 去会议室：走廊 → 侧翼入口 → 椅背后方就位 */
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

    const isLeft = anchor.x < 15.2;
    const isRight = anchor.x > 15.2;
    const inletX = isLeft ? 12.4 + spread * 0.3 : isRight ? 17.8 + spread * 0.3 : 15.2;
    const inlet = walkStep(inletX, anchor.z, fromX, fromZ, "🚶 去会议室…");
    chain.push(inlet);
    fromX = inlet.x;
    fromZ = inlet.z;
  }

  appendBehindApproach(
    chain,
    anchor,
    fromX,
    fromZ,
    "🚶 去会议室…",
    finalSeat(anchor, "focusing", "🎯 专注会议中")
  );
  return chain;
}

/** 去休息区：走廊 → 西翼入口 → 椅/沙发正后方就位 */
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

    const inletX =
      anchor.activity === "coffee" ||
      anchor.activity === "water" ||
      anchor.activity === "microwave"
        ? -17.2 + spread * 0.25
        : -13.8 + spread * 0.35;
    const inlet = walkStep(inletX, anchor.z, fromX, fromZ, "🚶 去休息区…");
    chain.push(inlet);
    fromX = inlet.x;
    fromZ = inlet.z;
  }

  appendBehindApproach(
    chain,
    anchor,
    fromX,
    fromZ,
    "🚶 去休息区…",
    finalSeat(anchor, "resting", REST_ACTIVITY_LABELS[anchor.activity] ?? "☕ 休息中", {
      restActivity: anchor.activity,
    })
  );
  return chain;
}

/** 回工位：走廊 → 工位椅后 */
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

  const deskAnchor: WorldAnchor = {
    x: deskX,
    z: deskZ,
    rotation: emp.rotation,
  };

  if (Math.abs(deskZ) > 1.0 && Math.abs(cz) > 1.0) {
    const wp = walkStep(deskX + spread * 0.3, 0, cx, cz, "🚶 回工位…");
    chain.push(wp);
    cx = wp.x;
    cz = wp.z;
  }

  const pre = approachPointBehind(deskAnchor);
  if (Math.hypot(pre.x - cx, pre.z - cz) > 0.5) {
    chain.push(walkStep(pre.x, pre.z, cx, cz, "🚶 回工位…"));
  }

  chain.push(finalSeat(deskAnchor, "idle", ""));
  return chain;
}
