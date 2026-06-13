import { DurationParts } from "./types";

export function durationToSeconds({ hours, minutes, seconds }: DurationParts): number {
  return Math.max(0, hours * 3600 + minutes * 60 + seconds);
}

export function formatCountdown(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const DEFAULT_FOCUS_DURATION: DurationParts = {
  hours: 0,
  minutes: 25,
  seconds: 0,
};

export const DEFAULT_BREAK_DURATION: DurationParts = {
  hours: 0,
  minutes: 5,
  seconds: 0,
};
