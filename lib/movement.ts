import {
  approachPointBehind,
  REST_ANCHORS,
  WorldAnchor,
} from "./officeAnchors";
import { facingFromDelta } from "./characterFacing";
import { EmployeeConfig, MovementTarget } from "./types";

const EMPLOYEE_COUNT = 10;
const DEPART_STAGGER_SEC = 0.42;

/** 眼睛朝行进方向（局部 -Z 对齐位移向量） */
export function walkFacing(dx: number, dz: number): number {
  return facingFromDelta(dx, dz);
}

export function lerpAngle(cur: number, target: number, k: number): number {
  let diff = target - cur;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return cur + diff * k;
}

/** 把 10 人摊到走廊不同车道 */
function laneOffset(index: number, span = 3.4): number {
  return (index - (EMPLOYEE_COUNT - 1) / 2) * (span / (EMPLOYEE_COUNT - 1));
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

function holdStep(
  x: number,
  z: number,
  rotation: number,
  waitSec: number,
  text: string
): MovementTarget {
  return {
    x,
    z,
    rotation,
    finalStatus: "idle",
    waitSec,
    text,
  };
}

function finalSeat(
  anchor: WorldAnchor,
  status: MovementTarget["finalStatus"],
  extra?: Partial<MovementTarget>
): MovementTarget {
  return {
    x: anchor.x,
    z: anchor.z,
    rotation: anchor.rotation,
    finalStatus: status,
    ...extra,
  };
}

/** 最后一段：走到椅后 → 转身朝座位走过去（避免倒着入座） */
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
  chain.push({
    x: anchor.x,
    z: anchor.z,
    rotation: anchor.rotation,
    finalStatus: final.finalStatus,
    text: final.text,
    restActivity: final.restActivity,
  });
}

function corridorZ(emp: EmployeeConfig, index: number): number {
  const lane = laneOffset(index);
  const deskZ = emp.position[2];
  if (Math.abs(deskZ) <= 1.0) return lane;
  return deskZ * 0.2 + lane * 0.8;
}

/** 去会议室：分车道走廊 → 侧翼贴墙滑行 → 椅背后方就位 */
export function buildMeetingPath(
  emp: EmployeeConfig,
  index: number,
  anchor: WorldAnchor
): MovementTarget[] {
  const lane = laneOffset(index);
  const deskX = emp.position[0];
  const deskZ = emp.position[2];
  const chain: MovementTarget[] = [];
  let fromX = deskX;
  let fromZ = deskZ;

  if (index > 0) {
    chain.push(
      holdStep(deskX, deskZ, emp.rotation, index * DEPART_STAGGER_SEC, "🚶 准备出发…")
    );
  }

  const cz = corridorZ(emp, index);

  if (Math.abs(deskZ) > 1.0) {
    const wp = walkStep(deskX + lane * 0.18, cz, fromX, fromZ, "🚶 去会议室…");
    chain.push(wp);
    fromX = wp.x;
    fromZ = wp.z;
  }

  if (anchor.x > 10) {
    const glideZ = anchor.z * 0.55 + cz * 0.45;
    const mid = walkStep(deskX * 0.25 + lane * 0.5, glideZ, fromX, fromZ, "🚶 去会议室…");
    chain.push(mid);
    fromX = mid.x;
    fromZ = mid.z;

    const isLeft = anchor.x < 15.2;
    const isRight = anchor.x > 15.2;
    const wingX = isLeft ? 11.8 + lane * 0.22 : isRight ? 18.6 + lane * 0.22 : 15.2;
    const wing = walkStep(wingX, glideZ, fromX, fromZ, "🚶 去会议室…");
    chain.push(wing);
    fromX = wing.x;
    fromZ = wing.z;

    const inletX = isLeft
      ? 12.2 + lane * 0.35
      : isRight
        ? 17.6 + lane * 0.35
        : 15.2 + lane * 0.15;
    const inletZ = anchor.z + lane * 0.12;
    const inlet = walkStep(inletX, inletZ, fromX, fromZ, "🚶 去会议室…");
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
    finalSeat(anchor, "focusing")
  );
  return chain;
}

/** 去休息区：分车道走廊 → 西翼贴墙滑行 → 就位 */
export function buildBreakPath(
  emp: EmployeeConfig,
  index: number,
  anchor: (typeof REST_ANCHORS)[number]
): MovementTarget[] {
  const lane = laneOffset(index);
  const deskX = emp.position[0];
  const deskZ = emp.position[2];
  const chain: MovementTarget[] = [];
  let fromX = deskX;
  let fromZ = deskZ;

  if (index > 0) {
    chain.push(
      holdStep(deskX, deskZ, emp.rotation, index * DEPART_STAGGER_SEC, "🚶 准备出发…")
    );
  }

  const cz = corridorZ(emp, index);

  if (Math.abs(deskZ) > 1.0) {
    const wp = walkStep(deskX + lane * 0.18, cz, fromX, fromZ, "🚶 去休息区…");
    chain.push(wp);
    fromX = wp.x;
    fromZ = wp.z;
  }

  if (anchor.x < -10) {
    const glideZ = anchor.z * 0.55 + cz * 0.45;
    const mid = walkStep(deskX * 0.25 + lane * 0.5, glideZ, fromX, fromZ, "🚶 去休息区…");
    chain.push(mid);
    fromX = mid.x;
    fromZ = mid.z;

    const deepWest =
      anchor.activity === "coffee" ||
      anchor.activity === "water" ||
      anchor.activity === "microwave";
    const wingX = deepWest ? -18.4 + lane * 0.2 : -12.0 + lane * 0.28;
    const wing = walkStep(wingX, glideZ, fromX, fromZ, "🚶 去休息区…");
    chain.push(wing);
    fromX = wing.x;
    fromZ = wing.z;

    const inletX = deepWest ? -17.0 + lane * 0.3 : -13.6 + lane * 0.35;
    const inletZ = anchor.z + lane * 0.12;
    const inlet = walkStep(inletX, inletZ, fromX, fromZ, "🚶 去休息区…");
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
    finalSeat(anchor, "resting", {
      restActivity: anchor.activity,
    })
  );
  return chain;
}

/** 回工位：分车道回走廊再入座 */
export function buildDeskPathFrom(
  emp: EmployeeConfig,
  index: number,
  fromX: number,
  fromZ: number
): MovementTarget[] {
  const lane = laneOffset(index, 2.8);
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

  if (index > 0) {
    chain.push(holdStep(fromX, fromZ, emp.rotation, index * 0.28, "🚶 准备回工位…"));
    cx = fromX;
    cz = fromZ;
  }

  if (Math.abs(deskZ) > 1.0 && Math.abs(cz) > 1.0) {
    const corr = corridorZ(emp, index);
    const wp = walkStep(deskX + lane * 0.15, corr, cx, cz, "🚶 回工位…");
    chain.push(wp);
    cx = wp.x;
    cz = wp.z;
  }

  const pre = approachPointBehind(deskAnchor);
  if (Math.hypot(pre.x - cx, pre.z - cz) > 0.5) {
    chain.push(walkStep(pre.x, pre.z, cx, cz, "🚶 回工位…"));
  }

  chain.push(finalSeat(deskAnchor, "idle"));
  return chain;
}
