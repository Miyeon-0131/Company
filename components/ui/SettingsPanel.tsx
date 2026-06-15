"use client";

import { useCallback, useEffect, useState } from "react";
import { Theme, useThemeStore } from "@/lib/theme";
import { useOfficeStore } from "@/lib/store";
import { loadConfig, saveConfig } from "@/lib/config";

interface EnvStatus {
  claude: boolean;
  tavily: boolean;
  openai: boolean;
}

const ENV_LABELS: { key: keyof EnvStatus; label: string }[] = [
  { key: "tavily", label: "Tavily 联网搜索" },
  { key: "claude", label: "Claude 写报告" },
  { key: "openai", label: "OpenAI 配图" },
];

/** 设置入口：主题切换 + 交付收件人 */
export default function SettingsPanel() {
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const setSettingsOpen = useOfficeStore((s) => s.setSettingsOpen);
  const [recipient, setRecipient] = useState("");
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (settingsOpen) setRecipient(loadConfig().email ?? "");
  }, [settingsOpen]);

  const refreshEnv = useCallback(() => {
    fetch("/api/env-check")
      .then((r) => r.json())
      .then((data) =>
        setEnv({
          claude: !!data.claude,
          tavily: !!data.tavily,
          openai: !!data.openai,
        })
      )
      .catch(() => setEnv(null));
  }, []);

  useEffect(() => {
    if (settingsOpen) refreshEnv();
  }, [refreshEnv, settingsOpen]);

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "dark", label: "深色", icon: "🌙" },
    { value: "light", label: "浅色", icon: "☀️" },
  ];

  return (
    <>
      <button
        onClick={() => setSettingsOpen(true)}
        className="pointer-events-auto mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-[11px] tracking-wide text-slate-300 backdrop-blur-md transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
      >
        ⚙️ 设置
      </button>

      {settingsOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-[min(380px,94vw)] overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/98 shadow-[0_0_50px_rgba(34,211,238,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-wide text-cyan-300">
                ⚙️ 设置
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="mb-2 text-xs font-semibold text-slate-200">外观主题</p>
              <div className="flex gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      theme === opt.value
                        ? "border-cyan-400/60 bg-cyan-950/50 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                        : "border-white/10 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                切换办公室的整体光照氛围：深色为太空夜景，浅色为明亮白昼。
              </p>

              <p className="mb-2 mt-5 text-xs font-semibold text-slate-200">
                服务端 API 状态（Vercel 环境变量）
              </p>
              <div className="space-y-1.5 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5">
                {env ? (
                  ENV_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-400">{label}</span>
                      <span className={env[key] ? "text-emerald-300" : "text-amber-300"}>
                        {env[key] ? "✅ 已注入" : "⚠️ 未检测到"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500">检测中…</p>
                )}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Shared 变量需关联到 Company 项目并重新部署后才生效。
              </p>

              <p className="mb-2 mt-5 text-xs font-semibold text-slate-200">
                交付收件人
              </p>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onBlur={() =>
                  saveConfig({ ...loadConfig(), email: recipient.trim() })
                }
                placeholder="任务完成后邮件发到此邮箱"
                className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
              />
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                填写后，任务执行到「邮件专员」时会自动发送至该地址；也可在指令终端点击「立即发送」。
              </p>
            </div>

            <div className="flex justify-end border-t border-white/10 px-6 py-3.5">
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-1.5 text-xs font-bold tracking-wider text-white transition-all hover:brightness-110"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
