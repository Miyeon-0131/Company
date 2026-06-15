"use client";

import { useEffect, useRef } from "react";
import { EMPLOYEES } from "@/lib/employees";
import {
  AREA_CHATTER_GAP_MS,
  AREA_CHATTER_REPLY_DELAY_MS,
  AREA_CHATTER_SHOW_MS,
  ChatterScene,
  getBreakLinePool,
  getBreakReplyPool,
  getExpandChatter,
  getMeetingLinePool,
  getMeetingReplyPool,
  getQuipChatter,
  getReplyChatter,
  getRoleChatter,
  IDLE_CHATTER_GAP_MS,
  IDLE_CHATTER_REPLY_DELAY_MS,
  IDLE_CHATTER_SHOW_MS,
  pickAreaChatterMode,
  pickChatterMode,
  pickNonRepeatingLine,
} from "@/lib/idleChatter";
import { useOfficeStore } from "@/lib/store";
import { AgentStatus } from "@/lib/types";

interface LineState {
  cursor: number;
  recent: string[];
}

function speakersForScene(
  scene: ChatterScene,
  statuses: Record<string, AgentStatus>
): string[] {
  const want: AgentStatus =
    scene === "meeting" ? "focusing" : scene === "break" ? "resting" : "idle";
  return EMPLOYEES.filter((e) => (statuses[e.id] ?? "idle") === want).map(
    (e) => e.id
  );
}

/**
 * 区域对话：工位 / 会议室 / 休息区各自播报，会议聊议题、休息聊放松。
 */
export default function IdleChatterController() {
  const missionStatus = useOfficeStore((s) => s.mission?.status);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const officeMode = useOfficeStore((s) => s.officeMode);
  const setIdleChatter = useOfficeStore((s) => s.setIdleChatter);
  const loopGen = useRef(0);

  useEffect(() => {
    const missionBusy =
      missionStatus != null && missionStatus !== "done";

    if (settingsOpen || missionBusy) {
      setIdleChatter(null);
      return;
    }

    const scene: ChatterScene =
      officeMode === "focus"
        ? "meeting"
        : officeMode === "break"
          ? "break"
          : "desk";

    const gen = ++loopGen.current;
    let cancelled = false;
    let turnIdx = 0;
    const lineCounter: Record<string, number> = {};
    const replyCounter: Record<string, number> = {};
    const expandCounter: Record<string, number> = {};
    const meetingLineState: LineState = { cursor: 0, recent: [] };
    const meetingReplyState: LineState = { cursor: 0, recent: [] };
    const breakReplyState: LineState = { cursor: 0, recent: [] };
    const breakLineStates: Record<string, LineState> = {};
    let quipIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const showMs =
      scene === "desk" ? IDLE_CHATTER_SHOW_MS : AREA_CHATTER_SHOW_MS;
    const replyDelayMs =
      scene === "desk"
        ? IDLE_CHATTER_REPLY_DELAY_MS
        : AREA_CHATTER_REPLY_DELAY_MS;
    const gapMs = scene === "desk" ? IDLE_CHATTER_GAP_MS : AREA_CHATTER_GAP_MS;

    const breakLineState = (activity: string | null | undefined): LineState => {
      const key = activity ?? "generic";
      if (!breakLineStates[key]) {
        breakLineStates[key] = { cursor: 0, recent: [] };
      }
      return breakLineStates[key]!;
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const loop = async () => {
      while (!cancelled && loopGen.current === gen) {
        const state = useOfficeStore.getState();
        const speakerIds = speakersForScene(scene, state.statuses);

        if (!speakerIds.length) {
          setIdleChatter(null);
          await sleep(gapMs);
          continue;
        }

        const mode =
          scene === "desk"
            ? pickChatterMode(turnIdx, speakerIds.length)
            : pickAreaChatterMode(turnIdx, speakerIds.length, scene);
        const leadId = speakerIds[turnIdx % speakerIds.length]!;
        turnIdx += 1;

        let leadText: string;
        if (mode === "quip" && scene === "desk") {
          leadText = getQuipChatter(quipIdx++);
        } else if (scene === "meeting") {
          leadText = pickNonRepeatingLine(
            getMeetingLinePool(),
            meetingLineState
          );
        } else if (scene === "break") {
          const activity = state.restActivities[leadId];
          leadText = pickNonRepeatingLine(
            getBreakLinePool(activity),
            breakLineState(activity)
          );
        } else {
          const leadLineIdx = lineCounter[leadId] ?? 0;
          lineCounter[leadId] = leadLineIdx + 1;
          leadText = getRoleChatter(leadId, leadLineIdx);
        }

        const others = speakerIds.filter((id) => id !== leadId);
        let reply: { speakerId: string; text: string } | undefined;

        if (mode === "reply" && others.length > 0) {
          const replyId = others[(turnIdx + 2) % others.length]!;
          if (scene === "meeting") {
            reply = {
              speakerId: replyId,
              text: pickNonRepeatingLine(
                getMeetingReplyPool(),
                meetingReplyState
              ),
            };
          } else if (scene === "break") {
            reply = {
              speakerId: replyId,
              text: pickNonRepeatingLine(getBreakReplyPool(), breakReplyState),
            };
          } else {
            const pairKey = `${scene}:${leadId}->${replyId}`;
            const replyIdx = replyCounter[pairKey] ?? 0;
            replyCounter[pairKey] = replyIdx + 1;
            reply = {
              speakerId: replyId,
              text: getReplyChatter(leadId, replyId, replyIdx),
            };
          }
        } else if (mode === "expand" && others.length > 0) {
          const replyId = others[(turnIdx + 1) % others.length]!;
          if (scene === "meeting") {
            reply = {
              speakerId: replyId,
              text: pickNonRepeatingLine(
                getMeetingReplyPool(),
                meetingReplyState
              ),
            };
          } else if (scene === "break") {
            reply = {
              speakerId: replyId,
              text: pickNonRepeatingLine(getBreakReplyPool(), breakReplyState),
            };
          } else {
            const pairKey = `expand:${scene}:${leadId}->${replyId}`;
            const expandIdx = expandCounter[pairKey] ?? 0;
            expandCounter[pairKey] = expandIdx + 1;
            reply = {
              speakerId: replyId,
              text: getExpandChatter(leadId, replyId, expandIdx),
            };
          }
        }

        setIdleChatter({
          lead: { speakerId: leadId, text: leadText },
        });

        if (reply) {
          await sleep(replyDelayMs);
          if (cancelled || loopGen.current !== gen) break;
          setIdleChatter({
            lead: { speakerId: leadId, text: leadText },
            reply,
          });
        }

        await sleep(showMs);
        if (cancelled || loopGen.current !== gen) break;

        setIdleChatter(null);
        await sleep(gapMs);
      }
    };

    void loop();

    return () => {
      cancelled = true;
      loopGen.current += 1;
      timers.forEach(clearTimeout);
      setIdleChatter(null);
    };
  }, [missionStatus, settingsOpen, officeMode, setIdleChatter]);

  return null;
}
