import { IdleActivity } from "./types";

export const IDLE_ACTIVITY_LABELS: Record<IdleActivity, string | null> = {
  sit: null,
  coffee: null,
  stretch: null,
  phone: null,
  daze: null,
};

function employeeSalt(employeeId: string): number {
  return employeeId.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
}

/** 工位摸鱼动作轮换：每人独立节奏，避免全员同步做同一动作 */
export function pickIdleActivity(turnIdx: number, employeeId: string): IdleActivity {
  const salt = employeeSalt(employeeId);
  const roll = (turnIdx * 11 + salt * 3 + 7) % 10;
  if (roll < 2) return "sit";
  if (roll < 5) return "coffee";
  if (roll < 7) return "stretch";
  if (roll < 8) return "phone";
  return "daze";
}

export const IDLE_ACTIVITY_CYCLE_MS = 9000;
