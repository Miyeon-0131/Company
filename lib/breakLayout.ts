/**
 * 休息区沙发落座（局部坐标，与 BreakArea Sofa 一致）
 * seat 为身体中心，沿面朝方向略前移，避免陷入靠背
 */

import { backVector, facingVector, seatRootAt } from "./characterFacing";

/** 沙发模型：坐垫 local z=-0.05，靠背 local z=0.34 */
const CUSHION_LOCAL_Z = -0.05;
const BACKREST_LOCAL_Z = 0.34;

/** 从面朝方向前移，使人坐在坐垫前侧 */
const SOFA_FORWARD_SHIFT = 0.28;

export type BreakSofaSpec = {
  originX: number;
  originZ: number;
  rotation: number;
  width?: number;
};

export const BREAK_SOFA_SPECS: BreakSofaSpec[] = [
  { originX: 0.4, originZ: 5.4, rotation: 0, width: 2.2 },
  { originX: -0.6, originZ: 1.9, rotation: Math.PI, width: 1.0 },
  { originX: 1.4, originZ: 1.9, rotation: Math.PI, width: 1.0 },
];

function sofaSeat(spec: BreakSofaSpec) {
  const cushionZ = spec.originZ + CUSHION_LOCAL_Z;
  const face = facingVector(spec.rotation);
  return {
    x: spec.originX,
    z: cushionZ + face.z * SOFA_FORWARD_SHIFT,
    rotation: spec.rotation,
  };
}

export const BREAK_SOFAS = BREAK_SOFA_SPECS.map(sofaSeat);

/** 校验：身体后侧不应超过靠背前缘 */
export function verifySofaSeats(): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  let ok = true;

  for (const spec of BREAK_SOFA_SPECS) {
    const seat = sofaSeat(spec);
    const root = seatRootAt(seat.x, seat.z, seat.rotation);
    const back = backVector(seat.rotation);
    const bodyBackZ = seat.z + back.z * 0.38;
    const backrestZ =
      spec.originZ +
      (spec.rotation === 0 ? BACKREST_LOCAL_Z : -BACKREST_LOCAL_Z);
    const clear = spec.rotation === 0 ? bodyBackZ < backrestZ - 0.05 : bodyBackZ > backrestZ + 0.05;
    const line = `${spec.originX},${spec.originZ} rot=${spec.rotation.toFixed(2)} seatZ=${seat.z.toFixed(2)} bodyBackZ=${bodyBackZ.toFixed(2)} backrestZ=${backrestZ.toFixed(2)} ${clear ? "OK" : "BAD"}`;
    lines.push(line);
    if (!clear) ok = false;
  }

  return { ok, lines };
}
