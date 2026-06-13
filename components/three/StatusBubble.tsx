"use client";

import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { AgentStatus } from "@/lib/types";
import { getIdleChatter } from "@/lib/idleChatter";

interface StatusBubbleProps {
  employeeId: string;
  status: AgentStatus;
  name: string;
  workingLabel: string;
  overrideText?: string | null;
  accentColor: string;
  hideLabels?: boolean;
}

const BUBBLE_STYLE: Record<
  AgentStatus,
  { text: string; className: string; showDots: boolean }
> = {
  idle: {
    text: "☕ 摸鱼中",
    className: "bg-slate-800/90 text-slate-300 border-slate-500/50",
    showDots: false,
  },
  thinking: {
    text: "💭 头脑风暴中",
    className:
      "bg-violet-950/90 text-violet-200 border-violet-400/60 shadow-[0_0_18px_rgba(167,139,250,0.45)]",
    showDots: true,
  },
  working: {
    text: "⌨️ 疯狂敲击键盘",
    className:
      "bg-cyan-950/90 text-cyan-200 border-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.45)]",
    showDots: true,
  },
  done: {
    text: "✅ 任务完成!",
    className:
      "bg-emerald-950/90 text-emerald-200 border-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.55)]",
    showDots: false,
  },
};

export default function StatusBubble({
  employeeId,
  status,
  name,
  workingLabel,
  overrideText,
  accentColor,
  hideLabels,
}: StatusBubbleProps) {
  const style = BUBBLE_STYLE[status];
  const [idleTick, setIdleTick] = useState(0);

  // 待机时每 9 秒换一句闲聊
  useEffect(() => {
    if (status !== "idle") return;
    const id = setInterval(() => setIdleTick((t) => t + 1), 9000);
    return () => clearInterval(id);
  }, [status]);

  if (hideLabels) return null;

  const idleLine = getIdleChatter(employeeId, idleTick);
  const text =
    overrideText ??
    (status === "working"
      ? workingLabel
      : status === "idle"
        ? idleLine
        : style.text);

  const isIdleChat = status === "idle" && !overrideText;

  return (
    <Html
      position={[0, 2.1, 0]}
      center
      distanceFactor={11}
      zIndexRange={[30, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="flex select-none flex-col items-center gap-1">
        {/* 状态气泡 / 待机对话框 */}
        <div className="relative flex flex-col items-center">
          <div
            className={`border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-500 ${
              isIdleChat
                ? "max-w-[210px] whitespace-normal text-left leading-relaxed rounded-2xl rounded-bl-sm bg-slate-800/95 text-slate-200 border-slate-500/55 shadow-lg"
                : `whitespace-nowrap rounded-full ${style.className} ${
                    status === "done" ? "animate-bounce" : ""
                  }`
            }`}
          >
            <span>{text}</span>
            {style.showDots && (
              <span className="ml-1.5 inline-flex gap-0.5 align-middle">
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
              </span>
            )}
          </div>
          {/* 对话框小尾巴 */}
          {isIdleChat && (
            <div
              className="absolute -bottom-1.5 left-3 h-2.5 w-2.5 rotate-45 border-b border-l border-slate-500/55 bg-slate-800/95"
              aria-hidden
            />
          )}
        </div>
        {/* 职位名牌 */}
        <div
          className="whitespace-nowrap rounded-md border border-white/10 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-sm"
          style={{ borderBottomColor: accentColor, borderBottomWidth: 2 }}
        >
          {name}
        </div>
      </div>
    </Html>
  );
}
