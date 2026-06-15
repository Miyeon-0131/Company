"use client";

import dynamic from "next/dynamic";
import { DEPARTMENTS } from "@/lib/employees";
import { useOfficeStore } from "@/lib/store";
import CommandConsole from "@/components/ui/CommandConsole";
import ResultModal from "@/components/ui/ResultModal";
import SettingsPanel from "@/components/ui/SettingsPanel";
import WorkScreenPanel from "@/components/ui/WorkScreenPanel";
import IdleChatterController from "@/components/IdleChatterController";
import IdleActivityController from "@/components/IdleActivityController";
import OfficeModeController from "@/components/OfficeModeController";
import FocusModePanel from "@/components/ui/FocusModePanel";

// R3F 场景只能在客户端渲染
const OfficeScene = dynamic(() => import("@/components/three/OfficeScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="text-sm tracking-widest text-cyan-300/70">
          正在初始化虚拟办公室...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const officeMode = useOfficeStore((s) => s.officeMode);
  const modeCameraLocked = useOfficeStore((s) => s.modeCameraLocked);
  const setModeCameraLocked = useOfficeStore((s) => s.setModeCameraLocked);

  const modeActive = officeMode !== "normal";

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <IdleChatterController />
      <IdleActivityController />
      <OfficeModeController />
      <OfficeScene />

      {/* 专注/休息：点击画面中央解锁环绕镜头 */}
      {modeActive && modeCameraLocked && !settingsOpen && (
        <button
          type="button"
          aria-label="点击解锁视角"
          onClick={() => setModeCameraLocked(false)}
          className="absolute left-52 right-80 top-28 bottom-40 z-[6] cursor-pointer bg-transparent"
        >
          <span className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/50 px-3 py-1.5 text-[10px] tracking-wide text-slate-300/90 backdrop-blur-sm">
            点击画面解锁视角
          </span>
        </button>
      )}

      {/* ── 顶部：公司标题 ─────────────────────────── */}
      <header className="pointer-events-none absolute left-5 top-5 z-10">
        <div className="rounded-xl border border-white/10 bg-slate-950/60 px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            <h1 className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-lg font-bold tracking-wide text-transparent">
              AI Agent Virtual Office
            </h1>
          </div>
          <p className="mt-0.5 text-[11px] tracking-widest text-slate-400">
            多智能体虚拟公司 · CEO 控制台
          </p>
        </div>
      </header>

      {/* ── 右上：部门图例（设置打开时隐藏，避免遮挡） ── */}
      <aside className="pointer-events-none absolute right-5 top-5 z-10">
        {!settingsOpen && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-md">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: dept.color }}
              />
              <span className="text-[11px] tracking-wide text-slate-300">
                {dept.name}
              </span>
            </div>
          ))}
          <div className="my-0.5 border-t border-white/10" />
          {[
            { name: "会议室", color: "#38bdf8" },
            { name: "茶水间 · 休息区", color: "#fb7185" },
          ].map((zone) => (
            <div key={zone.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: zone.color }}
              />
              <span className="text-[11px] tracking-wide text-slate-300">
                {zone.name}
              </span>
            </div>
          ))}
        </div>
        )}
        <SettingsPanel />
      </aside>

      {/* ── 左侧：专注模式 + 员工工作屏幕 ──── */}
      {!settingsOpen && <FocusModePanel />}
      {!settingsOpen && <WorkScreenPanel />}

      {/* ── 底部：CEO 指令终端（设置打开时隐藏） ── */}
      {!settingsOpen && <CommandConsole />}

      {/* ── 任务完成后的交付报告弹窗 ────────────────── */}
      <ResultModal />
    </main>
  );
}
