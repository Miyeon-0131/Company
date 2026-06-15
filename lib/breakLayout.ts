/** 休息区沙发落座（局部坐标，与 BreakArea Sofa 一致） */

/** 坐垫中心：沙发原点 z + 坐垫 local z(-0.05) */
export const BREAK_SOFAS = [
  { x: 0.4, z: 5.35, rotation: 0 },
  { x: -0.6, z: 1.85, rotation: Math.PI },
  { x: 1.4, z: 1.85, rotation: Math.PI },
] as const;
