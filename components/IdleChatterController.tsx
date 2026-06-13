"use client";

import { useEffect, useRef } from "react";
import { EMPLOYEES } from "@/lib/employees";
import {
  getExpandChatter,
  getQuipChatter,
  getReplyChatter,
  getRoleChatter,
  IDLE_CHATTER_GAP_MS,
  IDLE_CHATTER_REPLY_DELAY_MS,
  IDLE_CHATTER_SHOW_MS,
  pickChatterMode,
} from "@/lib/idleChatter";
import { useOfficeStore } from "@/lib/store";

/**
 * 全局待机播报：模式随机轮换。
 * solo / quip → 仅一人；reply / expand → 先主发言，3 秒后再接话，显示 10 秒后一起消失。
 */
export default function IdleChatterController() {
  const missionStatus = useOfficeStore((s) => s.mission?.status);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const setIdleChatter = useOfficeStore((s) => s.setIdleChatter);
  const loopGen = useRef(0);

  useEffect(() => {
    const busy =
      settingsOpen || (missionStatus != null && missionStatus !== "done");

    if (busy) {
      setIdleChatter(null);
      return;
    }

    const gen = ++loopGen.current;
    let cancelled = false;
    let turnIdx = 0;
    const lineCounter: Record<string, number> = {};
    const replyCounter: Record<string, number> = {};
    const expandCounter: Record<string, number> = {};
    let quipIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const loop = async () => {
      while (!cancelled && loopGen.current === gen) {
        const state = useOfficeStore.getState();
        const idleIds = EMPLOYEES.filter(
          (e) => (state.statuses[e.id] ?? "idle") === "idle"
        ).map((e) => e.id);

        if (!idleIds.length) {
          setIdleChatter(null);
          await sleep(IDLE_CHATTER_GAP_MS);
          continue;
        }

        const mode = pickChatterMode(turnIdx, idleIds.length);
        const leadId = idleIds[turnIdx % idleIds.length]!;
        turnIdx += 1;

        let leadText: string;
        if (mode === "quip") {
          leadText = getQuipChatter(quipIdx++);
        } else {
          const leadLineIdx = lineCounter[leadId] ?? 0;
          lineCounter[leadId] = leadLineIdx + 1;
          leadText = getRoleChatter(leadId, leadLineIdx);
        }

        const others = idleIds.filter((id) => id !== leadId);
        let reply: { speakerId: string; text: string } | undefined;

        if (mode === "reply" && others.length > 0) {
          const replyId = others[(turnIdx + 2) % others.length]!;
          const pairKey = `${leadId}->${replyId}`;
          const replyIdx = replyCounter[pairKey] ?? 0;
          replyCounter[pairKey] = replyIdx + 1;
          reply = {
            speakerId: replyId,
            text: getReplyChatter(leadId, replyId, replyIdx),
          };
        } else if (mode === "expand" && others.length > 0) {
          const replyId = others[(turnIdx + 1) % others.length]!;
          const pairKey = `expand:${leadId}->${replyId}`;
          const expandIdx = expandCounter[pairKey] ?? 0;
          expandCounter[pairKey] = expandIdx + 1;
          reply = {
            speakerId: replyId,
            text: getExpandChatter(leadId, replyId, expandIdx),
          };
        }

        setIdleChatter({
          lead: { speakerId: leadId, text: leadText },
        });

        if (reply) {
          await sleep(IDLE_CHATTER_REPLY_DELAY_MS);
          if (cancelled || loopGen.current !== gen) break;
          setIdleChatter({
            lead: { speakerId: leadId, text: leadText },
            reply,
          });
        }

        await sleep(IDLE_CHATTER_SHOW_MS);
        if (cancelled || loopGen.current !== gen) break;

        setIdleChatter(null);
        await sleep(IDLE_CHATTER_GAP_MS);
      }
    };

    void loop();

    return () => {
      cancelled = true;
      loopGen.current += 1;
      timers.forEach(clearTimeout);
      setIdleChatter(null);
    };
  }, [missionStatus, settingsOpen, setIdleChatter]);

  return null;
}
