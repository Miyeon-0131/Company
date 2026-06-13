"use client";

import { useEffect } from "react";
import { EMPLOYEES } from "@/lib/employees";
import {
  getRoleChatter,
  IDLE_CHATTER_GAP_MS,
  IDLE_CHATTER_SHOW_MS,
} from "@/lib/idleChatter";
import { useOfficeStore } from "@/lib/store";

/**
 * 全局待机播报：同一时间只有一位 idle 员工说话，显示 3 秒后间隔 5 秒再换下一位。
 */
export default function IdleChatterController() {
  const missionStatus = useOfficeStore((s) => s.mission?.status);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const setIdleChatter = useOfficeStore((s) => s.setIdleChatter);

  useEffect(() => {
    const busy =
      settingsOpen || (missionStatus != null && missionStatus !== "done");

    if (busy) {
      setIdleChatter(null);
      return;
    }

    let cancelled = false;
    let speakerIdx = 0;
    const lineCounter: Record<string, number> = {};
    const timers: ReturnType<typeof setTimeout>[] = [];

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const loop = async () => {
      while (!cancelled) {
        const state = useOfficeStore.getState();
        const idleIds = EMPLOYEES.filter(
          (e) => (state.statuses[e.id] ?? "idle") === "idle"
        ).map((e) => e.id);

        if (!idleIds.length) {
          setIdleChatter(null);
          await sleep(IDLE_CHATTER_GAP_MS);
          continue;
        }

        const speakerId = idleIds[speakerIdx % idleIds.length]!;
        speakerIdx += 1;
        const lineIdx = lineCounter[speakerId] ?? 0;
        lineCounter[speakerId] = lineIdx + 1;

        setIdleChatter({
          speakerId,
          text: getRoleChatter(speakerId, lineIdx),
        });

        await sleep(IDLE_CHATTER_SHOW_MS);
        if (cancelled) break;

        setIdleChatter(null);
        await sleep(IDLE_CHATTER_GAP_MS);
      }
    };

    void loop();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      setIdleChatter(null);
    };
  }, [missionStatus, settingsOpen, setIdleChatter]);

  return null;
}
