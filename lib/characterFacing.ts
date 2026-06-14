/**
 * 角色朝向约定（Three.js / Employee.tsx）
 * - 正面（眼睛、打字方向）：局部 -Z → 世界 (sin θ, -cos θ)
 * - 背部（坐姿锚点偏移）：局部 +Z → 世界 (sin θ, cos θ)
 * - 移动时 rotation 必须让眼睛朝向行进方向，不能倒着走
 */

export const CHARACTER_SIT_OFFSET = 0.85;

export function facingVector(rotation: number): { x: number; z: number } {
  return { x: Math.sin(rotation), z: -Math.cos(rotation) };
}

export function backVector(rotation: number): { x: number; z: number } {
  // 局部 +Z（椅背/臀部方向），与正面相反
  return { x: -Math.sin(rotation), z: Math.cos(rotation) };
}

/** 从位移/目标方向求面朝角（眼睛朝该方向） */
export function facingFromDelta(dx: number, dz: number): number {
  if (Math.hypot(dx, dz) < 0.001) return 0;
  return Math.atan2(dx, -dz);
}

/** 坐姿局部偏移 (0,0,SIT) 旋转后的世界位移 */
export function sitOffsetVector(rotation: number): { x: number; z: number } {
  return {
    x: CHARACTER_SIT_OFFSET * Math.sin(rotation),
    z: CHARACTER_SIT_OFFSET * Math.cos(rotation),
  };
}

/** 已知身体落点（椅心），反算 root：visual = root + sitOffset */
export function seatRootAt(
  seatX: number,
  seatZ: number,
  rotation: number
): { x: number; z: number; rotation: number } {
  const off = sitOffsetVector(rotation);
  return {
    x: seatX - off.x,
    z: seatZ - off.z,
    rotation,
  };
}

/** 在落座点身后（沿背部方向）的接近点 */
export function approachBehindSeat(
  seatX: number,
  seatZ: number,
  rotation: number,
  distance: number
): { x: number; z: number; rotation: number } {
  const back = backVector(rotation);
  return {
    x: seatX + back.x * distance,
    z: seatZ + back.z * distance,
    rotation,
  };
}
