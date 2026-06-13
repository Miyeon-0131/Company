"use client";

import { useCallback, useEffect, useState } from "react";
import { Theme, useThemeStore } from "@/lib/theme";

interface MailStatus {
  configured: boolean;
  email: string | null;
}

interface EnvStatus {
  claude: boolean;
  tavily: boolean;
  openai: boolean;
  github: boolean;
  googleOAuth: boolean;
  smtp: boolean;
}

const ENV_LABELS: { key: keyof EnvStatus; label: string }[] = [
  { key: "tavily", label: "Tavily 联网搜索" },
  { key: "claude", label: "Claude 写报告" },
  { key: "openai", label: "OpenAI 配图" },
  { key: "github", label: "GitHub Token" },
  { key: "googleOAuth", label: "Google 邮箱 OAuth" },
  { key: "smtp", label: "SMTP 发信" },
];

/** 设置入口：主题切换 + 邮箱 Google 登录授权 */
export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [mail, setMail] = useState<MailStatus>({ configured: false, email: null });
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const refreshMail = useCallback(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setMail)
      .catch(() => {});
    fetch("/api/env-check")
      .then((r) => r.json())
      .then(setEnv)
      .catch(() => setEnv(null));
  }, []);

  useEffect(() => {
    refreshMail();
  }, [refreshMail, open]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    refreshMail();
  };

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "dark", label: "深色", icon: "🌙" },
    { value: "light", label: "浅色", icon: "☀️" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-[11px] tracking-wide text-slate-300 backdrop-blur-md transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
      >
        ⚙️ 设置
      </button>

      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[min(380px,94vw)] overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/95 shadow-[0_0_50px_rgba(34,211,238,0.15)]"
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

              {/* 邮箱授权 */}
              <p className="mb-2 mt-5 text-xs font-semibold text-slate-200">
                邮箱授权（邮件专员发信）
              </p>
              {mail.email ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2.5">
                  <span className="text-emerald-400">✅</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-emerald-200">
                    {mail.email}
                  </span>
                  <button
                    onClick={logout}
                    className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:text-slate-200"
                  >
                    退出
                  </button>
                </div>
              ) : mail.configured ? (
                <a
                  href="/api/auth/google"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition-all hover:brightness-95"
                >
                  <svg viewBox="0 0 48 48" className="h-4 w-4">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.3h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17.2z" />
                    <path fill="#FBBC05" d="M10.5 19.3l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7z" />
                    <path fill="#34A853" d="M24 48c6.1 0 11.6-2 15.5-5.5l-7.1-5.5c-2 1.3-4.6 2.1-8.4 2.1-6.3 0-11.6-3.8-13.5-9.3l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                  </svg>
                  用 Google 登录授权邮箱
                </a>
              ) : (
                <p className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
                  未配置 Google 登录。在 <code className="text-slate-400">.env.local</code> 填入
                  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 后即可用 Google 账号授权发信
                  （也可改用 SMTP 授权码）。
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-white/10 px-6 py-3.5">
              <button
                onClick={() => setOpen(false)}
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
