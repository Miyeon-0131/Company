import { EMPLOYEES } from "./employees";
import { MEETING_CENTER } from "./officeAnchors";

/** 员工碰撞半径（米） */
export const EMPLOYEE_RADIUS = 0.28;

/** 员工之间最小间距 */
export const EMPLOYEE_SEPARATION = 0.52;

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const MC = MEETING_CENTER[0];
const BC = -15.2;

/** 仅桌面+显示器区域，不挡工位后方过道 */
function deskBox(x: number, z: number): AABB {
  return { minX: x - 0.42, maxX: x + 0.42, minZ: z - 0.55, maxZ: z + 0.12 };
}

/** 静态障碍物（墙体、大型设备）— 不含工位间可通行区域 */
export const OFFICE_OBSTACLES: AABB[] = [
  { minX: -19.2, maxX: 19.2, minZ: -8.3, maxZ: -7.6 },
  { minX: -19.2, maxX: 19.2, minZ: 7.6, maxZ: 8.3 },
  { minX: -19.2, maxX: -18.4, minZ: -8, maxZ: 8 },
  { minX: 18.4, maxX: 19.2, minZ: -8, maxZ: 8 },

  { minX: 18.2, maxX: 19.0, minZ: -5.8, maxZ: 5.8 },
  { minX: 11.8, maxX: 18.6, minZ: -6.0, maxZ: -5.0 },
  { minX: 11.8, maxX: 18.6, minZ: 5.0, maxZ: 6.0 },
  { minX: 14.0, maxX: 16.4, minZ: -5.2, maxZ: -3.8 },
  { minX: MC - 0.65, maxX: MC + 0.65, minZ: -1.2, maxZ: 2.2 },

  { minX: BC - 3.5, maxX: BC - 2.5, minZ: -4.5, maxZ: 3.5 },
  { minX: BC - 3.4, maxX: BC - 2.6, minZ: 0.2, maxZ: 1.8 },
  { minX: BC - 1.2, maxX: BC + 1.2, minZ: -6.5, maxZ: -5.8 },
  { minX: BC - 1.8, maxX: BC + 0.1, minZ: 5.0, maxZ: 6.0 },

  { minX: -0.7, maxX: 0.7, minZ: -7.8, maxZ: -6.5 },

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
  const nudgeX = clampFloor(x + (nextX - x) * 0.35, z, radius);
  if (!hitsObstacle(nudgeX.x, nudgeX.z, radius)) return nudgeX;
  const nudgeZ = clampFloor(x, z + (nextZ - z) * 0.35, radius);
  if (!hitsObstacle(nudgeZ.x, nudgeZ.z, radius)) return nudgeZ;
  return clampFloor(x, z, radius);
}

/** 员工互斥：避免在走廊叠在一起卡死 */
export function separateFromOthers(
  employeeId: string,
  x: number,
  z: number,
  poses: Record<string, { x: number; z: number }>
): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (const emp of EMPLOYEES) {
    if (emp.id === employeeId) continue;
    const other = poses[emp.id];
    if (!other) continue;
    const ox = px - other.x;
    const oz = pz - other.z;
    const dist = Math.hypot(ox, oz);
    if (dist < EMPLOYEE_SEPARATION && dist > 0.001) {
      const push = (EMPLOYEE_SEPARATION - dist) / dist;
      px += ox * push;
      pz += oz * push;
    }
  }
  return clampFloor(px, pz, EMPLOYEE_RADIUS);
}
