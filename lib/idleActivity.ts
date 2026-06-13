import { IdleActivity } from "./types";

export const IDLE_ACTIVITY_LABELS: Record<IdleActivity, string | null> = {
  sit: null,
  coffee: "☕ 抿一口咖啡",
  stretch: "🙆 伸个懒腰",
  phone: "📱 刷会儿手机",
  daze: "😶‍🌫️ 放空发呆",
};

/** 工位摸鱼动作轮换：不总是干坐着 */
export function pickIdleActivity(turnIdx: number): IdleActivity {
  const roll = (turnIdx * 11 + 7) % 10;
  if (roll < 3) return "sit";
  if (roll < 6) return "coffee";
  if (roll < 8) return "stretch";
  if (roll < 9) return "phone";
  return "daze";
}

export const IDLE_ACTIVITY_CYCLE_MS = 9000;
