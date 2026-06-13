"use client";

import { useState } from "react";
import { useOfficeStore } from "@/lib/store";
import { EMPLOYEES, getDepartment } from "@/lib/employees";
import { downloadAllArtifacts, downloadArtifact } from "@/lib/client/download";
import { Artifact } from "@/lib/types";

/** 任务完成后的交付报告弹窗 */
export default function ResultModal() {
  const mission = useOfficeStore((s) => s.mission);
  const showResult = useOfficeStore((s) => s.showResult);
  const setShowResult = useOfficeStore((s) => s.setShowResult);
  const artifactCache = useOfficeStore((s) => s.artifactCache);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showResult || !mission || mission.status !== "done") return null;

  const allArtifacts: Artifact[] = mission.tasks.flatMap(
    (t) => t.artifacts ?? []
  );
  const artifactCount = allArtifacts.length;

  const handleDownloadAll = async () => {
    if (downloading || !artifactCount) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadAllArtifacts(allArtifacts, artifactCache, mission.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadOne = async (artifact: Artifact) => {
    if (downloading) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadArtifact(artifact, artifactCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载失败");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => setShowResult(false)}
    >
      <div
        className="flex max-h-[82vh] w-[min(620px,94vw)] flex-col overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950/95 shadow-[0_0_50px_rgba(52,211,153,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📦</span>
            <h2 className="text-base font-bold tracking-wide text-emerald-300">
              任务交付报告
            </h2>
            <span className="ml-auto rounded-full border border-emerald-400/40 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] tracking-wider text-emerald-300">
              {mission.plannerSource === "llm" ? "Claude 智能拆解" : "规则引擎拆解"}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
            <span className="text-slate-500">原始指令：</span>
            {mission.prompt}
          </p>
        </div>

        {/* 子任务产出列表 */}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-6 py-4">
          {mission.tasks.map((task, index) => {
            const employee = EMPLOYEES.find((e) => e.id === task.employeeId);
            const color = employee
              ? getDepartment(employee.departmentId).color
              : "#94a3b8";
            return (
              <div
                key={task.id}
                className="rounded-lg border border-white/8 bg-slate-900/60 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold text-slate-950"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {employee?.name ?? task.employeeId}
                  </span>
                  <span className="text-[11px] text-slate-500">{task.title}</span>
                  {task.mode && (
                    <span
                      className={`ml-auto shrink-0 rounded-full border px-1.5 py-px text-[9px] tracking-wider ${
                        task.mode === "real"
                          ? "border-emerald-400/40 text-emerald-300"
                          : "border-slate-500/40 text-slate-400"
                      }`}
                    >
                      {task.mode === "real" ? "真实执行" : "模拟"}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 pl-6 text-[11px] leading-relaxed text-slate-300">
                  {task.output}
                </p>
                {!!task.artifacts?.length && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                    {task.artifacts.map((artifact) => (
                      <button
                        key={artifact.url}
                        type="button"
                        disabled={downloading}
                        onClick={() => handleDownloadOne(artifact)}
                        className="rounded-md border border-cyan-400/30 bg-cyan-950/40 px-2 py-0.5 text-[10px] text-cyan-300 transition-colors hover:bg-cyan-900/50 disabled:opacity-50"
                      >
                        📎 {artifact.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="border-t border-white/10 px-6 py-3.5">
          {error && (
            <p className="mb-2 text-[11px] leading-relaxed text-rose-300">
              ⚠️ {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              ✅ {mission.tasks.length} 个子任务全部完成 · 共 {artifactCount} 份交付文件
            </p>
            <div className="flex shrink-0 gap-2">
              {artifactCount > 0 && (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-1.5 text-xs font-bold tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {downloading ? "打包中…" : "⬇️ 一键下载全部"}
                </button>
              )}
              <button
                onClick={() => setShowResult(false)}
                className="rounded-lg border border-white/15 px-4 py-1.5 text-xs font-bold tracking-wider text-slate-300 transition-colors hover:bg-white/10"
              >
                收下成果
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
