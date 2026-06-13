"use client";

import { Html } from "@react-three/drei";
import { AgentStatus } from "@/lib/types";

interface StatusBubbleProps {
  status: AgentStatus;
  /** 职位名称，常驻显示 */
  name: string;
  /** working 状态的自定义文案，例如 "🔍 正在谷歌搜索..." */
  workingLabel: string;
  /** Task Manager 下发的覆盖文案 */
  overrideText?: string | null;
  accentColor: string;
}

const BUBBLE_STYLE: Record<
  AgentStatus,
  { text: string; className: string; showDots: boolean }
> = {
  idle: {
    text: "☕ 摸鱼中",
    className: "bg-slate-800/80 text-slate-400 border-slate-600/40",
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
  status,
  name,
  workingLabel,
  overrideText,
  accentColor,
}: StatusBubbleProps) {
  const style = BUBBLE_STYLE[status];
  const text =
    overrideText ?? (status === "working" ? workingLabel : style.text);

  return (
    <Html
      position={[0, 2.1, 0]}
      center
      distanceFactor={11}
      zIndexRange={[30, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="flex select-none flex-col items-center gap-1 whitespace-nowrap">
        {/* 状态气泡 */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-300 ${style.className} ${
            status === "done" ? "animate-bounce" : ""
          }`}
        >
          <span>{text}</span>
          {style.showDots && (
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
            </span>
          )}
        </div>
        {/* 职位名牌 */}
        <div
          className="rounded-md border border-white/10 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur-sm"
          style={{ borderBottomColor: accentColor, borderBottomWidth: 2 }}
        >
          {name}
        </div>
      </div>
    </Html>
  );
}
