"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useOfficeStore } from "@/lib/store";
import { runMission } from "@/lib/agentManager";
import { loadConfig, saveConfig } from "@/lib/config";
import { isValidEmail } from "@/lib/mail";
import { LogEntry } from "@/lib/types";

const EXAMPLES = [
  "帮我调研最新的 AI 行业新闻，总结成 Word 文档，数据整理成 Excel，最后转成 PDF 发邮件给我",
  "调研 GitHub 上热门的开源 Agent 框架，写一份技术选型报告并做成 PPT 汇报",
  "搜集新能源汽车市场数据，配几张插画，输出图文版 PDF 报告",
];

const LOG_COLOR: Record<LogEntry["kind"], string> = {
  system: "text-slate-400",
  manager: "text-violet-300",
  agent: "text-cyan-300",
  done: "text-emerald-300",
};

const SIZE_KEY = "console-size";
const MIN_W = 420;
const MIN_H = 140;
const MAX_W = 1200;
const MAX_H = 520;

export default function CommandConsole() {
  const [input, setInput] = useState("");
  const [mailTo, setMailTo] = useState("");
  const [sending, setSending] = useState(false);
  const [mailHint, setMailHint] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 760, height: 280 });
  const logs = useOfficeStore((s) => s.logs);
  const mission = useOfficeStore((s) => s.mission);
  const logEndRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);
  const start = useRef({ x: 0, y: 0, w: 760, h: 280 });

  const busy = !!mission && mission.status !== "done";

  useEffect(() => {
    setMailTo(loadConfig().email ?? "");
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SIZE_KEY) ?? "null");
      if (saved?.width && saved?.height) setSize(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      resizing.current = true;
      start.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [size]
  );

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const dx = e.clientX - start.current.x;
    const dy = start.current.y - e.clientY; // 向上拖增高
    setSize({
      width: Math.min(MAX_W, Math.max(MIN_W, start.current.w + dx)),
      height: Math.min(MAX_H, Math.max(MIN_H, start.current.h + dy)),
    });
  }, []);

  const onResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    resizing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setSize((s) => {
      localStorage.setItem(SIZE_KEY, JSON.stringify(s));
      return s;
    });
  }, []);

  const persistMailTo = (value: string) => {
    saveConfig({ ...loadConfig(), email: value.trim() });
  };

  const sendMailNow = async () => {
    const to = mailTo.trim();
    if (!isValidEmail(to)) {
      setMailHint("请填写有效的收件人邮箱");
      return;
    }
    setSending(true);
    setMailHint(null);
    const mission = useOfficeStore.getState().mission;
    try {
      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          missionId: mission?.status === "done" ? mission.id : undefined,
          prompt: mission?.prompt,
        }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok) {
        setMailHint(data.error ?? "发送失败");
        return;
      }
      setMailHint(data.summary ?? "已发送");
      useOfficeStore.getState().addLog("邮件专员", data.summary ?? "邮件已发送", "done");
    } catch (err) {
      setMailHint(err instanceof Error ? err.message : "网络异常");
    } finally {
      setSending(false);
    }
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const prompt = input.trim();
    if (!prompt || busy) return;
    setInput("");
    void runMission(prompt);
  };

  const logHeight = Math.max(0, size.height - 128);

  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 z-[60] -translate-x-1/2"
      style={{ width: size.width, maxWidth: "94vw" }}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950/85 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-md"
        style={{ height: size.height }}
      >
        {/* 左上角拖拽调整大小 */}
        <div
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          className="absolute left-0 top-0 z-10 flex h-5 w-5 cursor-nwse-resize items-center justify-center rounded-br-md bg-cyan-400/10 text-[9px] text-cyan-400/60 transition-colors hover:bg-cyan-400/25 hover:text-cyan-300"
          title="拖拽调整大小"
        >
          ⤡
        </div>

        {/* 终端标题栏 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-2 pl-6">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono text-[11px] tracking-widest text-slate-400">
            CEO 指令终端 — boss@virtual-office
          </span>
          {busy && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-cyan-300">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400" />
              {mission?.status === "planning" ? "项目经理拆解中..." : "团队执行中..."}
            </span>
          )}
        </div>

        {/* 日志区（高度随面板伸缩） */}
        {logs.length > 0 && (
          <div
            className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] leading-relaxed"
            style={{ minHeight: logHeight > 0 ? logHeight : undefined }}
          >
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="shrink-0 text-slate-600">[{log.time}]</span>
                <span className={`shrink-0 font-semibold ${LOG_COLOR[log.kind]}`}>
                  {log.source}
                </span>
                <span className="break-all text-slate-300">{log.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}

        {/* 收件人 */}
        <div className="flex shrink-0 items-center gap-2 border-t border-white/5 px-4 py-2">
          <span className="shrink-0 font-mono text-[11px] text-slate-500">📨 发送至</span>
          <input
            type="email"
            value={mailTo}
            onChange={(e) => setMailTo(e.target.value)}
            onBlur={() => persistMailTo(mailTo)}
            disabled={busy || sending}
            placeholder="收件人邮箱，例如 boss@company.com"
            className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-slate-200 placeholder-slate-600 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void sendMailNow()}
            disabled={busy || sending || !mailTo.trim()}
            className="shrink-0 rounded-md border border-cyan-400/30 px-2.5 py-1 text-[10px] font-semibold text-cyan-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "发送中..." : "立即发送"}
          </button>
        </div>
        {mailHint && (
          <p className="shrink-0 px-4 pb-1 font-mono text-[10px] text-amber-300/90">
            {mailHint}
          </p>
        )}

        {/* 输入区 */}
        <form
          onSubmit={submit}
          className="flex shrink-0 items-center gap-2 border-t border-white/5 px-4 py-3"
        >
          <span className="font-mono text-sm text-cyan-400">►</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder={
              busy
                ? "团队正在执行任务，请稍候..."
                : "向你的 AI 公司下达指令，例如：调研 AI 新闻并输出 PDF 报告..."
            }
            className="flex-1 bg-transparent font-mono text-sm text-slate-100 placeholder-slate-600 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-1.5 text-xs font-bold tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "执行中..." : "下达指令"}
          </button>
        </form>
      </div>

      {/* 示例指令 */}
      {!busy && logs.length === 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="max-w-full truncate rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-sm transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
