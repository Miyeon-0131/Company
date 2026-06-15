"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BREAK_DURATION,
  DEFAULT_FOCUS_DURATION,
  durationToSeconds,
  formatCountdown,
} from "@/lib/focusMode";
import { useOfficeStore } from "@/lib/store";
import { DurationParts } from "@/lib/types";

function DurationInput({
  label,
  value,
  onChange,
  accent,
  disabled,
}: {
  label: string;
  value: DurationParts;
  onChange: (v: DurationParts) => void;
  accent: string;
  disabled?: boolean;
}) {
  const fields: { key: keyof DurationParts; unit: string; max: number }[] = [
    { key: "hours", unit: "时", max: 23 },
    { key: "minutes", unit: "分", max: 59 },
    { key: "seconds", unit: "秒", max: 59 },
  ];

  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400">
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        {fields.map(({ key, unit, max }) => (
          <label key={key} className="flex flex-col items-center gap-0.5">
            <input
              type="number"
              min={0}
              max={max}
              disabled={disabled}
              value={value[key]}
              onChange={(e) => {
                const n = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                onChange({ ...value, [key]: n });
              }}
              className="w-12 rounded-md border border-white/10 bg-slate-900/80 px-1.5 py-1 text-center text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-40"
              style={{ borderBottomColor: accent, borderBottomWidth: 2 }}
            />
            <span className="text-[9px] text-slate-500">{unit}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FocusModePanel() {
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const officeMode = useOfficeStore((s) => s.officeMode);
  const modeRemainingSec = useOfficeStore((s) => s.modeRemainingSec);
  const startFocusSession = useOfficeStore((s) => s.startFocusSession);
  const startBreakSession = useOfficeStore((s) => s.startBreakSession);
  const stopOfficeMode = useOfficeStore((s) => s.stopOfficeMode);
  const setFocusPanelOpen = useOfficeStore((s) => s.setFocusPanelOpen);
  const modeCameraLocked = useOfficeStore((s) => s.modeCameraLocked);
  const setModeCameraLocked = useOfficeStore((s) => s.setModeCameraLocked);

  const [focusDur, setFocusDur] = useState(DEFAULT_FOCUS_DURATION);
  const [breakDur, setBreakDur] = useState(DEFAULT_BREAK_DURATION);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setFocusPanelOpen(open);
    return () => setFocusPanelOpen(false);
  }, [open, setFocusPanelOpen]);

  if (settingsOpen) return null;

  const active = officeMode !== "normal";
  const focusSec = durationToSeconds(focusDur);
  const breakSec = durationToSeconds(breakDur);
  const canStartFocus = focusSec > 0;
  const canStartBreak = breakSec > 0;

  const headerLabel =
    officeMode === "focus"
      ? "🎯 专注中"
      : officeMode === "break"
        ? "☕ 休息中"
        : "专注 · 休息";

  return (
    <div className="pointer-events-auto absolute left-5 top-28 z-10 w-56">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left backdrop-blur-md transition-colors ${
          active
            ? officeMode === "focus"
              ? "border-sky-400/50 bg-sky-950/70"
              : "border-rose-400/50 bg-rose-950/70"
            : "border-white/10 bg-slate-950/60 hover:bg-slate-900/70"
        }`}
      >
        <div>
          <div
            className={`text-xs font-bold tracking-wide ${
              officeMode === "break" ? "text-rose-300" : "text-sky-300"
            }`}
          >
            {headerLabel}
          </div>
          {active && (
            <div className="mt-0.5 font-mono text-sm text-white/90">
              {formatCountdown(modeRemainingSec)}
            </div>
          )}
          {active && modeCameraLocked && (
            <div className="mt-0.5 text-[9px] text-white/50">镜头锁定 · 点画面解锁</div>
          )}
        </div>
        <span className="text-slate-500">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-md">
          <DurationInput
            label="专注时长"
            value={focusDur}
            onChange={setFocusDur}
            accent="#38bdf8"
            disabled={active}
          />
          <DurationInput
            label="休息时长"
            value={breakDur}
            onChange={setBreakDur}
            accent="#fb7185"
            disabled={active}
          />

          {active ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setModeCameraLocked(!modeCameraLocked)}
                className="w-full rounded-lg border border-white/15 bg-slate-900/60 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800/70"
              >
                {modeCameraLocked ? "🔒 点击画面解锁视角" : "🔓 重新锁定镜头"}
              </button>
              <button
                type="button"
                onClick={stopOfficeMode}
                className="w-full rounded-lg border border-rose-400/40 bg-rose-950/50 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-900/60"
              >
                {officeMode === "focus" ? "结束专注" : "结束休息"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!canStartFocus}
                onClick={() => {
                  startFocusSession(focusDur);
                  setOpen(false);
                }}
                className="w-full rounded-lg border border-sky-400/40 bg-sky-950/50 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-900/60 disabled:opacity-40"
              >
                开始专注
              </button>
              <button
                type="button"
                disabled={!canStartBreak}
                onClick={() => {
                  startBreakSession(breakDur);
                  setOpen(false);
                }}
                className="w-full rounded-lg border border-rose-400/40 bg-rose-950/50 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-900/60 disabled:opacity-40"
              >
                开始休息
              </button>
            </div>
          )}

          <p className="text-[9px] leading-relaxed text-slate-500">
            专注与休息可独立开启；进入后镜头默认环绕锁定，点击画面一次即可自由旋转，也可在面板中重新锁定。老板下指令时全员回工位。
          </p>
        </div>
      )}
    </div>
  );
}
