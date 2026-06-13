"use client";

import { useEffect, useRef, useState } from "react";
import { useOfficeStore } from "@/lib/store";
import { EMPLOYEES, getDepartment } from "@/lib/employees";
import { AgentStatus, ScreenEntry } from "@/lib/types";
import { downloadArtifact } from "@/lib/client/download";

const STATUS_BADGE: Record<AgentStatus, { text: string; className: string }> = {
  idle: { text: "待机", className: "border-slate-500/40 text-slate-400" },
  thinking: { text: "思考中", className: "border-violet-400/50 text-violet-300" },
  working: { text: "工作中", className: "border-cyan-400/50 text-cyan-300" },
  done: { text: "已完成", className: "border-emerald-400/50 text-emerald-300" },
  walking: { text: "赶路中", className: "border-slate-400/50 text-slate-300" },
  focusing: { text: "专注中", className: "border-sky-400/50 text-sky-300" },
  resting: { text: "休息中", className: "border-rose-400/50 text-rose-300" },
};

function EntryLine({
  entry,
  artifactCache,
}: {
  entry: ScreenEntry;
  artifactCache: Record<string, import("@/lib/types").Artifact>;
}) {
  const [busy, setBusy] = useState(false);

  const handleArtifactDownload = async () => {
    if (!entry.url || busy) return;
    setBusy(true);
    try {
      await downloadArtifact(
        { name: entry.text, url: entry.url },
        artifactCache
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "下载失败");
    } finally {
      setBusy(false);
    }
  };

  switch (entry.kind) {
    case "link":
      return (
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-2 rounded-md border border-cyan-400/15 bg-cyan-950/30 px-2.5 py-1.5 transition-colors hover:border-cyan-400/40 hover:bg-cyan-900/40"
        >
          <span className="mt-px shrink-0 text-cyan-400">🌐</span>
          <span className="min-w-0">
            <span className="block truncate text-cyan-200 underline-offset-2 group-hover:underline">
              {entry.text}
            </span>
            <span className="block truncate text-[10px] text-slate-500">
              {entry.url}
            </span>
          </span>
        </a>
      );
    case "artifact":
      return (
        <button
          type="button"
          disabled={busy}
          onClick={handleArtifactDownload}
          className="flex w-full items-center gap-2 rounded-md border border-emerald-400/15 bg-emerald-950/30 px-2.5 py-1.5 text-left text-emerald-200 transition-colors hover:border-emerald-400/40 hover:bg-emerald-900/40 disabled:opacity-50"
        >
          <span>{busy ? "⏳" : "📎"}</span>
          <span className="truncate underline-offset-2 hover:underline">
            {entry.text}
          </span>
        </button>
      );
    case "result":
      return (
        <p className="text-emerald-200/90">
          <span className="mr-1.5 text-slate-600">[{entry.time}]</span>
          ✅ {entry.text}
        </p>
      );
    default:
      return (
        <p className="text-slate-300">
          <span className="mr-1.5 text-slate-600">[{entry.time}]</span>
          {entry.text}
        </p>
      );
  }
}

const EMPTY_ENTRIES: ScreenEntry[] = [];

/** 员工"电脑屏幕"面板：实时显示该员工的工作记录与可点击的网页/文件 */
export default function WorkScreenPanel() {
  const activeScreen = useOfficeStore((s) => s.activeScreen);
  const setActiveScreen = useOfficeStore((s) => s.setActiveScreen);
  // 注意：selector 必须返回稳定引用（store 里的原对象或模块级常量），
  // 否则每次返回新数组会触发无限重渲染
  const entries =
    useOfficeStore((s) => (activeScreen ? s.screens[activeScreen] : undefined)) ??
    EMPTY_ENTRIES;
  const artifactCache = useOfficeStore((s) => s.artifactCache);
  const status =
    useOfficeStore((s) => (activeScreen ? s.statuses[activeScreen] : undefined)) ??
    "idle";
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (!activeScreen) return null;
  const employee = EMPLOYEES.find((e) => e.id === activeScreen);
  if (!employee) return null;
  const color = getDepartment(employee.departmentId).color;
  const badge = STATUS_BADGE[status];

  return (
    <div className="pointer-events-auto absolute left-5 top-24 z-[70] flex max-h-[calc(100vh-220px)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 shadow-[0_0_36px_rgba(34,211,238,0.14)] backdrop-blur-md">
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-bold tracking-wide text-slate-100">
          {employee.name} 的工作屏幕
        </span>
        <span
          className={`rounded-full border px-2 py-px text-[10px] tracking-wider ${badge.className}`}
        >
          {status === "working" && (
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400 align-middle" />
          )}
          {badge.text}
        </span>
        <button
          onClick={() => setActiveScreen(null)}
          className="ml-auto rounded-md px-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {/* 屏幕内容 */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-slate-500">
            ☕ 今天还没有任务，正在摸鱼…
          </p>
        ) : (
          entries.map((entry) => (
            <EntryLine
              key={entry.id}
              entry={entry}
              artifactCache={artifactCache}
            />
          ))
        )}
        {status === "working" && (
          <p className="animate-pulse text-cyan-300">▍正在执行...</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-2 text-[10px] text-slate-500">
        🌐 网页与 📎 文件均可点击，在新标签页打开 · 点击其他员工可切换屏幕
      </div>
    </div>
  );
}
