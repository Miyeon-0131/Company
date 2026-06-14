import { EMPLOYEES } from "./employees";
import { MEETING_CENTER } from "./officeAnchors";

/** 员工碰撞半径（米） */
export const EMPLOYEE_RADIUS = 0.38;

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const MC = MEETING_CENTER[0];
const BC = -15.2;

function deskBox(x: number, z: number): AABB {
  return { minX: x - 0.95, maxX: x + 0.95, minZ: z - 0.55, maxZ: z + 1.35 };
}

/** 静态障碍物（墙体、桌椅、设备） */
export const OFFICE_OBSTACLES: AABB[] = [
  // 办公区外缘
  { minX: -19.2, maxX: 19.2, minZ: -8.3, maxZ: -7.6 },
  { minX: -19.2, maxX: 19.2, minZ: 7.6, maxZ: 8.3 },
  { minX: -19.2, maxX: -18.4, minZ: -8, maxZ: 8 },
  { minX: 18.4, maxX: 19.2, minZ: -8, maxZ: 8 },

  // 会议室：东墙 + 北/南墙 + 大屏 + 长桌
  { minX: 18.2, maxX: 19.0, minZ: -5.8, maxZ: 5.8 },
  { minX: 11.8, maxX: 18.6, minZ: -6.0, maxZ: -5.0 },
  { minX: 11.8, maxX: 18.6, minZ: 5.0, maxZ: 6.0 },
  { minX: 14.0, maxX: 16.4, minZ: -5.2, maxZ: -3.8 },
  { minX: MC - 0.85, maxX: MC + 0.85, minZ: -2.1, maxZ: 2.9 },

  // 茶水间：操作台 + 冰箱 + 售货机
  { minX: BC - 3.7, maxX: BC - 2.4, minZ: -4.8, maxZ: 3.8 },
  { minX: BC - 3.6, maxX: BC - 2.5, minZ: 0.0, maxZ: 2.2 },
  { minX: BC - 1.5, maxX: BC + 1.5, minZ: -6.8, maxZ: -5.6 },
  { minX: BC - 2.2, maxX: BC + 0.2, minZ: 4.6, maxZ: 6.2 },
  { minX: BC + 0.5, maxX: BC + 2.2, minZ: 1.0, maxZ: 2.8 },

  // 打印机
  { minX: -1.0, maxX: 1.0, minZ: -8.0, maxZ: -6.0 },

  // 各工位桌面（离开工位时仍保留，行走需绕行）
  ...EMPLOYEES.map((e) => deskBox(e.position[0], e.position[2])),
];

const FLOOR = { minX: -18.5, maxX: 18.5, minZ: -7.5, maxZ: 7.5 };

function hitsObstacle(x: number, z: number, r: number): boolean {
  for (const box of OFFICE_OBSTACLES) {
    const nx = Math.max(box.minX, Math.min(x, box.maxX));
    const nz = Math.max(box.minZ, Math.min(z, box.maxZ));
    const dx = x - nx;
    const dz = z - nz;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

function clampFloor(x: number, z: number, r: number) {
  return {
    x: Math.max(FLOOR.minX + r, Math.min(FLOOR.maxX - r, x)),
    z: Math.max(FLOOR.minZ + r, Math.min(FLOOR.maxZ - r, z)),
  };
}

/** 带碰撞体积的移动解析：撞墙时尝试滑移 */
export function resolveMovement(
  x: number,
  z: number,
  nextX: number,
  nextZ: number,
  radius = EMPLOYEE_RADIUS
): { x: number; z: number } {
  const target = clampFloor(nextX, nextZ, radius);
  if (!hitsObstacle(target.x, target.z, radius)) {
    return target;
  }
  const slideX = clampFloor(target.x, z, radius);
  if (!hitsObstacle(slideX.x, slideX.z, radius)) {
    return slideX;
  }
  const slideZ = clampFloor(x, target.z, radius);
  if (!hitsObstacle(slideZ.x, slideZ.z, radius)) {
    return slideZ;
  }
  return clampFloor(x, z, radius);
}
