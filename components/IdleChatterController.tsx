"use client";

import { useEffect } from "react";
import { EMPLOYEES } from "@/lib/employees";
import {
  getReplyChatter,
  getRoleChatter,
  IDLE_CHATTER_GAP_MS,
  IDLE_CHATTER_SHOW_MS,
} from "@/lib/idleChatter";
import { useOfficeStore } from "@/lib/store";

/**
 * 全局待机播报：最多两人同时说话。
 * 第一人岗位台词 → 第二人接话「是啊，…」→ 显示 3 秒 → 间隔 5 秒。
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
    let turnIdx = 0;
    const lineCounter: Record<string, number> = {};
    const replyCounter: Record<string, number> = {};
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

        const leadId = idleIds[turnIdx % idleIds.length]!;
        turnIdx += 1;
        const leadLineIdx = lineCounter[leadId] ?? 0;
        lineCounter[leadId] = leadLineIdx + 1;
        const leadText = getRoleChatter(leadId, leadLineIdx);

        const others = idleIds.filter((id) => id !== leadId);
        let reply: { speakerId: string; text: string } | undefined;

        // 有第二位 idle 同事时，约 80% 概率接话
        if (others.length > 0 && turnIdx % 5 !== 0) {
          const replyId = others[(turnIdx + 2) % others.length]!;
          const pairKey = `${leadId}->${replyId}`;
          const replyIdx = replyCounter[pairKey] ?? 0;
          replyCounter[pairKey] = replyIdx + 1;
          reply = {
            speakerId: replyId,
            text: getReplyChatter(leadId, replyId, replyIdx),
          };
        }

        setIdleChatter({
          lead: { speakerId: leadId, text: leadText },
          reply,
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
