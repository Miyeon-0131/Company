import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, PDFFont, PDFString, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import nodemailer from "nodemailer";
import { Artifact } from "@/lib/types";
import { chatClaude, extractJsonObject } from "@/lib/server/llm";
import { GmailAuth, sendGmail } from "@/lib/server/google";

/**
 * Worker Agent 真实工具层（服务端执行）。
 * 每个工具优先走真实链路（联网搜索 / GitHub API / 真实生成文件 / SMTP 发信），
 * 缺少对应环境变量时降级为模拟结果（mode = "mock"）。
 */

export interface ToolInput {
  summary: string;
  payload?: unknown;
}

export interface ExecContext {
  prompt: string;
  inputs: ToolInput[];
  missionId: string;
  /** 已登录的 Gmail 授权（来自 Google OAuth），优先用它发信 */
  gmailAuth?: GmailAuth | null;
}

export interface ExecResult {
  summary: string;
  payload?: unknown;
  artifacts?: Artifact[];
  mode: "real" | "mock";
}

interface SearchHit {
  title: string;
  url: string;
  content: string;
}

interface RepoHit {
  fullName: string;
  stars: number;
  description: string;
  url: string;
  language: string;
}

const GEN_DIR = path.join(process.cwd(), "generated");

const topic = (prompt: string) =>
  prompt.length > 24 ? `${prompt.slice(0, 24)}…` : prompt;

async function saveArtifact(
  missionId: string,
  name: string,
  data: Buffer | Uint8Array | string
): Promise<Artifact> {
  const dir = path.join(GEN_DIR, missionId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), data);
  return { name, url: `/api/files/${missionId}/${encodeURIComponent(name)}` };
}

/** 从上游产出中收集全部网页来源（搜索结果 + GitHub 仓库），按 URL 去重 */
function collectLinks(ctx: ExecContext): { title: string; url: string; brief: string }[] {
  const links: { title: string; url: string; brief: string }[] = [];
  const seen = new Set<string>();
  ctx.inputs.forEach((input) => {
    if (!Array.isArray(input.payload)) return;
    (input.payload as Array<Record<string, unknown>>).forEach((p) => {
      const url = typeof p.url === "string" ? p.url : null;
      if (!url || seen.has(url)) return;
      seen.add(url);
      links.push({
        title:
          (typeof p.title === "string" && p.title) ||
          (typeof p.fullName === "string" && p.fullName) ||
          url,
        url,
        brief:
          (typeof p.content === "string" && p.content) ||
          (typeof p.description === "string" && p.description) ||
          "",
      });
    });
  });
  return links;
}

/** 从上游产出中找到统计数据（Python 工程师的 stats.json） */
function findStats(
  ctx: ExecContext
): { topKeywords: { word: string; count: number }[] } | null {
  for (const input of ctx.inputs) {
    const p = input.payload as { topKeywords?: { word: string; count: number }[] };
    if (p && Array.isArray(p.topKeywords)) {
      return p as { topKeywords: { word: string; count: number }[] };
    }
  }
  return null;
}

// ── 通用：Tavily 联网搜索 ─────────────────────────
async function tavilySearch(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 6,
      search_depth: "basic",
    }),
  });
  if (!res.ok) throw new Error(`Tavily API ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map(
    (r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      content: (r.content ?? "").slice(0, 500),
    })
  );
}

function makeSearcher(flavor: "global" | "local") {
  return async (ctx: ExecContext): Promise<ExecResult> => {
    const key = process.env.TAVILY_API_KEY;
    const query =
      flavor === "global"
        ? `${ctx.prompt} latest news`
        : `${ctx.prompt} 国内 中文 最新动态`;
    if (key) {
      const hits = await tavilySearch(query, key);
      const titles = hits.slice(0, 3).map((h) => `《${h.title}》`).join("、");
      return {
        summary: `已实时联网检索「${topic(ctx.prompt)}」，命中 ${hits.length} 条${flavor === "global" ? "全球" : "中文"}资料，要点来源：${titles}`,
        payload: hits,
        mode: "real",
      };
    }
    return {
      summary: `（模拟）围绕「${topic(ctx.prompt)}」生成了 ${flavor === "global" ? "全球资讯" : "国内行情"}摘要`,
      payload: [],
      mode: "mock",
    };
  };
}

// ── GitHub 仓库搜索（匿名可用，Token 提升限额）──────
async function githubSearch(ctx: ExecContext): Promise<ExecResult> {
  // 优先取指令中的英文技术词作为搜索词，GitHub 对中文支持较差
  const asciiWords = ctx.prompt.match(/[A-Za-z][\w.+-]{1,}/g) ?? [];
  const query = (asciiWords.length ? asciiWords.slice(0, 5).join(" ") : ctx.prompt.slice(0, 30)).trim();

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-virtual-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=6`,
    { headers }
  );
  if (!res.ok) {
    return {
      summary: `（模拟）GitHub API 暂不可用（HTTP ${res.status}，匿名限额 10 次/分钟）`,
      payload: [],
      mode: "mock",
    };
  }
  const data = await res.json();
  const repos: RepoHit[] = (data.items ?? []).map(
    (r: {
      full_name: string;
      stargazers_count: number;
      description: string | null;
      html_url: string;
      language: string | null;
    }) => ({
      fullName: r.full_name,
      stars: r.stargazers_count,
      description: (r.description ?? "").slice(0, 200),
      url: r.html_url,
      language: r.language ?? "N/A",
    })
  );
  const top = repos
    .slice(0, 3)
    .map((r) => `${r.fullName}（★${(r.stars / 1000).toFixed(1)}k）`)
    .join("、");
  return {
    summary: `已通过 GitHub API 真实检索「${query}」，分析 ${repos.length} 个高星仓库：${top}`,
    payload: repos,
    mode: "real",
  };
}

// ── Excel：Claude 智能整表 + 原始数据真实写成 .xlsx ──
/** 让 Claude 根据任务设计最合适的分析表（时间线/对比表等），失败返回 null */
async function buildAnalysisSheet(
  ctx: ExecContext
): Promise<{ name: string; rows: Record<string, unknown>[] } | null> {
  if (!process.env.CLAUDE_API_KEY) return null;
  const links = collectLinks(ctx);
  const material = links
    .map((l, i) => `${i + 1}. ${l.title}\n${l.brief}`)
    .join("\n");
  if (!material.trim()) return null;

  try {
    const raw = await chatClaude(
      `你是数据分析师。根据老板的任务和搜集到的素材，设计一张最适合该任务的数据分析表
（例如发展史任务用时间线表：年份/事件/意义；对比任务用对比表；调研任务用要点归纳表）。
要求：
1. 充分利用素材中的具体事实（时间、数字、名称），不要写"查询了几个网页"这类过程描述；
2. 8-16 行，3-5 列，列名和内容全部用简体中文（专有名词保留英文）；
3. 只输出 JSON：{"sheetName":"表名(<=8字)","headers":["列1","列2"],"rows":[["值","值"]]}`,
      `任务：${ctx.prompt}\n\n素材：\n${material.slice(0, 4500)}`
    );
    const parsed = extractJsonObject<{
      sheetName: string;
      headers: string[];
      rows: unknown[][];
    }>(raw);
    if (!parsed.headers?.length || !parsed.rows?.length) return null;
    const rows = parsed.rows.map((r) =>
      Object.fromEntries(parsed.headers.map((h, i) => [h, r[i] ?? ""]))
    );
    return { name: (parsed.sheetName || "数据分析").slice(0, 28), rows };
  } catch {
    return null;
  }
}

async function buildExcel(ctx: ExecContext): Promise<ExecResult> {
  const wb = XLSX.utils.book_new();
  let rowCount = 0;

  // 1) Claude 智能分析表（放在第一个 Sheet，打开即见核心数据）
  const analysis = await buildAnalysisSheet(ctx);
  if (analysis) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(analysis.rows),
      analysis.name
    );
    rowCount += analysis.rows.length;
  }

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { 字段: "任务指令", 内容: ctx.prompt },
      { 字段: "生成时间", 内容: new Date().toLocaleString("zh-CN") },
      { 字段: "数据来源", 内容: `${ctx.inputs.length} 个上游 Agent` },
    ]),
    "任务信息"
  );

  let searchIdx = 0;
  ctx.inputs.forEach((input) => {
    const payload = input.payload;
    if (!Array.isArray(payload) || payload.length === 0) return;
    const first = payload[0] as Record<string, unknown>;
    let rows: Record<string, unknown>[];
    let sheetName: string;
    if ("fullName" in first) {
      sheetName = "GitHub仓库";
      rows = (payload as RepoHit[]).map((r) => ({
        仓库: r.fullName,
        星标: r.stars,
        语言: r.language,
        简介: r.description,
        链接: r.url,
      }));
    } else if ("title" in first) {
      searchIdx += 1;
      sheetName = `搜索结果${searchIdx}`;
      rows = (payload as SearchHit[]).map((h) => ({
        标题: h.title,
        摘要: h.content,
        链接: h.url,
      }));
    } else {
      return; // 非表格型数据（如报告正文）跳过
    }
    rowCount += rows.length;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
  });

  // 关键词统计（来自 Python 工程师）
  const stats = findStats(ctx);
  if (stats) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        stats.topKeywords.map((k, i) => ({
          排名: i + 1,
          关键词: k.word,
          出现次数: k.count,
        }))
      ),
      "关键词统计"
    );
  }

  // 全部来源链接汇总
  const links = collectLinks(ctx);
  if (links.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        links.map((l, i) => ({ 序号: i + 1, 标题: l.title, 链接: l.url }))
      ),
      "来源链接"
    );
    rowCount += links.length;
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const artifact = await saveArtifact(ctx.missionId, "dataset.xlsx", buffer);
  return {
    summary: analysis
      ? `已由 Claude 整理出「${analysis.name}」分析表，并真实生成 dataset.xlsx（${wb.SheetNames.length} 个 Sheet · ${rowCount} 行真实数据）`
      : `已将上游情报清洗为结构化数据，真实生成 dataset.xlsx（${wb.SheetNames.length} 个 Sheet · ${rowCount} 行真实数据，含标题/摘要/链接）`,
    payload: { rowCount },
    artifacts: [artifact],
    mode: "real",
  };
}

// ── Python工程师：真实统计计算（JS 实现）──────────
async function runStats(ctx: ExecContext): Promise<ExecResult> {
  const corpus = ctx.inputs
    .map((input) => {
      const payload = input.payload;
      if (Array.isArray(payload)) {
        return payload
          .map((p) => Object.values(p as Record<string, unknown>).join(" "))
          .join(" ");
      }
      return input.summary;
    })
    .join(" ");

  const tokens = corpus.match(/[\u4e00-\u9fa5]{2,6}|[A-Za-z][\w.-]{2,}/g) ?? [];
  const freq = new Map<string, number>();
  tokens.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  const stats = {
    totalChars: corpus.length,
    totalTokens: tokens.length,
    uniqueTokens: freq.size,
    topKeywords: top,
  };
  const artifact = await saveArtifact(
    ctx.missionId,
    "stats.json",
    JSON.stringify(stats, null, 2)
  );
  const kw = top.slice(0, 5).map((t) => t.word).join("、");
  return {
    summary: `已对 ${ctx.inputs.length} 份上游语料真实执行统计分析（${corpus.length} 字符 · ${freq.size} 个去重词条），高频关键词：${kw}，输出 stats.json`,
    payload: stats,
    artifacts: [artifact],
    mode: "real",
  };
}

function collectMaterial(ctx: ExecContext, limit = 5000): string {
  const parts: string[] = [];
  ctx.inputs.forEach((input) => {
    parts.push(`· ${input.summary}`);
    if (Array.isArray(input.payload)) {
      (input.payload as Array<Record<string, unknown>>)
        .slice(0, 5)
        .forEach((p) => {
          parts.push(
            `  - ${(p.title ?? p.fullName ?? "")} ${(p.content ?? p.description ?? "")}`
          );
        });
    }
  });
  return parts.join("\n").slice(0, limit);
}

function buildFallbackReport(ctx: ExecContext): string {
  return [
    `# ${topic(ctx.prompt)} 调研报告`,
    `\n## 执行摘要\n围绕「${ctx.prompt}」的调研已完成，以下为各环节产出汇总。`,
    `\n## 来源情报`,
    ...ctx.inputs.map((i) => `- ${i.summary}`),
  ].join("\n");
}

async function writeReport(ctx: ExecContext): Promise<ExecResult> {
  let markdown: string;
  let mode: "real" | "mock" = "mock";

  if (process.env.CLAUDE_API_KEY) {
    try {
      markdown = await chatClaude(
        "你是资深行业分析师。基于用户提供的指令与素材撰写一份结构完整的中文调研报告，使用 Markdown：一级标题做报告名，包含执行摘要、现状分析、关键发现、结论与建议。务实、具体、800-1500 字。",
        `指令：${ctx.prompt}\n\n素材：\n${collectMaterial(ctx)}`
      );
      mode = "real";
    } catch {
      markdown = buildFallbackReport(ctx);
    }
  } else {
    markdown = buildFallbackReport(ctx);
  }

  const children: Paragraph[] = markdown.split("\n").map((line) => {
    if (line.startsWith("# "))
      return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
    if (line.startsWith("## "))
      return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
    if (line.startsWith("### "))
      return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 });
    if (line.startsWith("- ") || line.startsWith("* "))
      return new Paragraph({ text: line.slice(2), bullet: { level: 0 } });
    return new Paragraph({
      children: [new TextRun(line.replace(/\*\*/g, ""))],
    });
  });

  // 附录：可点击的参考来源（Word 超链接）
  const links = collectLinks(ctx);
  if (links.length) {
    children.push(
      new Paragraph({ text: "参考来源", heading: HeadingLevel.HEADING_2 })
    );
    links.slice(0, 12).forEach((l, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun(`${i + 1}. ${l.title}  `),
            new ExternalHyperlink({
              link: l.url,
              children: [new TextRun({ text: l.url, style: "Hyperlink" })],
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const artifact = await saveArtifact(ctx.missionId, "report.docx", buffer);

  return {
    summary:
      mode === "real"
        ? `已由 Claude 真实撰写约 ${markdown.length} 字调研报告并生成 report.docx，含执行摘要、现状分析与结论建议`
        : `已按模板汇总各环节产出并真实生成 report.docx`,
    payload: markdown,
    artifacts: [artifact],
    mode,
  };
}

// ── PPT大师：真实生成 .pptx ───────────────────────
async function buildSlides(ctx: ExecContext): Promise<ExecResult> {
  const markdown = ctx.inputs.find((i) => typeof i.payload === "string")
    ?.payload as string | undefined;

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.3, height: 7.5 });
  pptx.layout = "WIDE";

  const cover = pptx.addSlide();
  cover.background = { color: "0F172A" };
  cover.addText(topic(ctx.prompt), {
    x: 0.8, y: 2.6, w: 11.7, h: 1.2,
    fontSize: 36, bold: true, color: "22D3EE",
  });
  cover.addText(`AI Agent Virtual Office · ${new Date().toLocaleDateString("zh-CN")}`, {
    x: 0.8, y: 4.0, w: 11.7, h: 0.6, fontSize: 14, color: "94A3B8",
  });

  // 1) 报告章节页：来自 Word 主笔的真实报告内容
  const sections = markdown
    ? markdown.split(/\n## /).slice(1).map((s) => {
        const [heading, ...body] = s.split("\n");
        return { heading, bullets: body.filter((l) => l.trim()).slice(0, 6) };
      })
    : [];

  sections.slice(0, 5).forEach(({ heading, bullets }) => {
    const slide = pptx.addSlide();
    slide.background = { color: "0F172A" };
    slide.addText(heading.replace(/^#+\s*/, ""), {
      x: 0.8, y: 0.5, w: 11.7, h: 0.9, fontSize: 26, bold: true, color: "22D3EE",
    });
    slide.addText(
      bullets.map((b) => ({
        text: b.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").slice(0, 120),
        options: { bullet: true, breakLine: true },
      })),
      { x: 0.9, y: 1.7, w: 11.5, h: 5.2, fontSize: 15, color: "E2E8F0" }
    );
  });

  // 2) 情报要点页：真实搜索结果的标题 + 摘要
  const links = collectLinks(ctx);
  let pageCount = sections.length;
  if (links.length) {
    links.slice(0, 8).reduce<typeof links[]>((groups, link, i) => {
      if (i % 4 === 0) groups.push([]);
      groups[groups.length - 1].push(link);
      return groups;
    }, []).forEach((group, gi) => {
      const slide = pptx.addSlide();
      slide.background = { color: "0F172A" };
      slide.addText(`关键情报${links.length > 4 ? ` (${gi + 1})` : ""}`, {
        x: 0.8, y: 0.5, w: 11.7, h: 0.9, fontSize: 26, bold: true, color: "22D3EE",
      });
      slide.addText(
        group.flatMap((l) => [
          { text: l.title.slice(0, 70), options: { bullet: true, bold: true, color: "7DD3FC", breakLine: true } },
          { text: l.brief.slice(0, 110) || "（详见来源链接）", options: { fontSize: 12, color: "94A3B8", breakLine: true } },
        ]),
        { x: 0.9, y: 1.6, w: 11.5, h: 5.4, fontSize: 14 }
      );
      pageCount += 1;
    });
  }

  // 3) 关键词统计页（来自 Python 工程师的真实词频）
  const stats = findStats(ctx);
  if (stats?.topKeywords.length) {
    const slide = pptx.addSlide();
    slide.background = { color: "0F172A" };
    slide.addText("高频关键词", {
      x: 0.8, y: 0.5, w: 11.7, h: 0.9, fontSize: 26, bold: true, color: "22D3EE",
    });
    slide.addText(
      stats.topKeywords.slice(0, 10).map((k, i) => ({
        text: `${i + 1}. ${k.word} — ${k.count} 次`,
        options: { breakLine: true },
      })),
      { x: 0.9, y: 1.7, w: 11.5, h: 5.2, fontSize: 16, color: "E2E8F0" }
    );
    pageCount += 1;
  }

  // 4) 参考来源页：可点击超链接
  if (links.length) {
    const slide = pptx.addSlide();
    slide.background = { color: "0F172A" };
    slide.addText("参考来源", {
      x: 0.8, y: 0.5, w: 11.7, h: 0.9, fontSize: 26, bold: true, color: "22D3EE",
    });
    slide.addText(
      links.slice(0, 10).map((l, i) => ({
        text: `${i + 1}. ${l.title.slice(0, 80)}`,
        options: {
          hyperlink: { url: l.url },
          color: "7DD3FC",
          fontSize: 13,
          breakLine: true,
        },
      })),
      { x: 0.9, y: 1.6, w: 11.5, h: 5.4 }
    );
    pageCount += 1;
  }

  if (pageCount === 0) {
    const slide = pptx.addSlide();
    slide.background = { color: "0F172A" };
    slide.addText(
      ctx.inputs.map((input) => ({ text: input.summary, options: { bullet: true, breakLine: true } })),
      { x: 0.9, y: 1.7, w: 11.5, h: 5.2, fontSize: 15, color: "E2E8F0" }
    );
    pageCount = 1;
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const artifact = await saveArtifact(ctx.missionId, "slides.pptx", buffer);
  return {
    summary: `已真实生成 slides.pptx（封面 + ${pageCount} 页：报告章节 / 关键情报 / 关键词统计 / 可点击参考来源）`,
    artifacts: [artifact],
    mode: "real",
  };
}

// ── AI美术：生图（暂用占位方案，后续可接入图像 API）──
/** 根据文件头推断图片扩展名 */
function sniffImageExt(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP")
    return "webp";
  return null;
}

// 生图提示词：强调无文字，避免封面上出现乱码字符
function buildArtPrompt(ctx: ExecContext): string {
  return `A clean modern business report cover illustration representing the theme: ${ctx.prompt.slice(0, 120)}. Flat vector style, deep blue and violet gradient, abstract geometric shapes, professional and elegant. Absolutely no text, no words, no letters, no captions.`;
}

/** 优先 OpenAI DALL·E（高质量），用 OPENAI_API_KEY 时启用 */
async function generateWithOpenAI(ctx: ExecContext): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      prompt: buildArtPrompt(ctx),
      n: 1,
      size: "1024x1024",
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`OpenAI 图像 ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const item = data.data?.[0];
  // 兼容两种返回：b64_json（gpt-image-1）或 url（dall-e-3 默认）
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(60_000) });
    if (!imgRes.ok) throw new Error(`下载图像 ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }
  throw new Error("OpenAI 未返回图像数据");
}

/** 免费兜底：Pollinations（需 token 时会失败）→ 失败则跳过 */
async function generateFree(ctx: ExecContext): Promise<Buffer | null> {
  const seed = Math.floor(Math.random() * 1e6);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(buildArtPrompt(ctx))}` +
    `?width=1024&height=1024&nologo=true&seed=${seed}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return sniffImageExt(buffer) ? buffer : null;
}

async function generateImage(ctx: ExecContext): Promise<ExecResult> {
  try {
    // 1) OpenAI DALL·E（配了 key 时，质量最佳、无乱码文字）
    let buffer = await generateWithOpenAI(ctx);
    let via = "OpenAI DALL·E 3";
    // 2) 免费兜底
    if (!buffer) {
      buffer = await generateFree(ctx);
      via = "免费图像服务";
    }
    if (!buffer) {
      return {
        summary: `（跳过）未配置 OpenAI key 且免费图源暂不可用 —— 在 .env.local 填入 OPENAI_API_KEY 即可生成高质量配图`,
        mode: "mock",
      };
    }
    const ext = sniffImageExt(buffer) ?? "png";
    const artifact = await saveArtifact(ctx.missionId, `cover.${ext}`, buffer);
    return {
      summary: `已通过 ${via} 生成封面插画 cover.${ext}（约 ${(buffer.length / 1024).toFixed(0)}KB）`,
      artifacts: [artifact],
      mode: "real",
    };
  } catch (err) {
    return {
      summary: `（跳过）配图生成失败（${err instanceof Error ? err.message : err}）`,
      mode: "mock",
    };
  }
}

// ── PDF打包员：真实合成中文 PDF ───────────────────
// 必须使用 TrueType (.ttf) 字体：pdf-lib 对 CFF 轮廓的 OTF（如思源黑体 OTF 版）
// 子集化存在 bug，嵌入不报错但中文字形渲染为空白。
const FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/StellarCN/scp_zh@master/fonts/SimHei.ttf",
  "https://raw.githubusercontent.com/StellarCN/scp_zh/master/fonts/SimHei.ttf",
];
let cachedFont: Buffer | null = null;

async function loadCJKFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  const cachePath = path.join(GEN_DIR, ".cache", "SimHei.ttf");
  try {
    cachedFont = await fs.readFile(cachePath);
    return cachedFont;
  } catch {
    /* 本地无缓存，联网下载 */
  }
  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      // 校验 TTF 文件头（0x00010000），防止缓存到错误内容
      if (buffer.length < 1024 || buffer.readUInt32BE(0) !== 0x00010000) continue;
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, buffer);
      cachedFont = buffer;
      return buffer;
    } catch {
      /* 尝试下一个源 */
    }
  }
  throw new Error("中文字体下载失败");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (font.widthOfTextAtSize(line + ch, size) > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function exportPdf(ctx: ExecContext): Promise<ExecResult> {
  let markdown =
    (ctx.inputs.find((i) => typeof i.payload === "string")?.payload as string) ??
    [`# ${topic(ctx.prompt)} 交付汇总`, ...ctx.inputs.map((i) => `- ${i.summary}`)].join("\n");

  // 附录：真实关键词统计 + 来源网页（标题与完整 URL）
  const stats = findStats(ctx);
  if (stats?.topKeywords.length) {
    markdown +=
      `\n\n## 附录 · 高频关键词\n` +
      stats.topKeywords
        .slice(0, 10)
        .map((k, i) => `${i + 1}. ${k.word}（${k.count} 次）`)
        .join("\n");
  }
  const links = collectLinks(ctx);
  if (links.length) {
    markdown +=
      `\n\n## 附录 · 参考来源\n` +
      links
        .slice(0, 12)
        .map((l, i) => `${i + 1}. ${l.title}\n${l.url}`)
        .join("\n");
  }

  try {
    const fontBytes = await loadCJKFont();
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const font = await pdf.embedFont(fontBytes, { subset: true });

    const pageSize: [number, number] = [595, 842]; // A4
    const margin = 56;
    const maxWidth = pageSize[0] - margin * 2;
    let page = pdf.addPage(pageSize);
    let y = pageSize[1] - margin;

    const drawLine = (text: string, size: number, color = rgb(0.13, 0.16, 0.25)) => {
      for (const segment of wrapText(text, font, size, maxWidth)) {
        if (y < margin + size) {
          page = pdf.addPage(pageSize);
          y = pageSize[1] - margin;
        }
        page.drawText(segment, { x: margin, y, size, font, color });
        y -= size * 1.65;
      }
    };

    // 绘制可点击超链接：蓝色 + 下划线 + URI 链接注解
    const linkColor = rgb(0.1, 0.45, 0.85);
    const drawLink = (url: string, size = 10.5) => {
      for (const segment of wrapText(url, font, size, maxWidth)) {
        if (y < margin + size) {
          page = pdf.addPage(pageSize);
          y = pageSize[1] - margin;
        }
        const w = font.widthOfTextAtSize(segment, size);
        page.drawText(segment, { x: margin, y, size, font, color: linkColor });
        page.drawLine({
          start: { x: margin, y: y - 1.5 },
          end: { x: margin + w, y: y - 1.5 },
          thickness: 0.5,
          color: linkColor,
        });
        const annot = pdf.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [margin, y - 3, margin + w, y + size],
          Border: [0, 0, 0],
          A: pdf.context.obj({ Type: "Action", S: "URI", URI: PDFString.of(url) }),
        });
        page.node.addAnnot(pdf.context.register(annot));
        y -= size * 1.65;
      }
    };

    for (const raw of markdown.split("\n")) {
      const line = raw.trim();
      if (!line) { y -= 8; continue; }
      if (line.startsWith("# ")) drawLine(line.slice(2), 22, rgb(0.05, 0.45, 0.55));
      else if (line.startsWith("## ")) { y -= 6; drawLine(line.slice(3), 15, rgb(0.1, 0.3, 0.45)); }
      else if (line.startsWith("### ")) drawLine(line.slice(4), 12.5, rgb(0.1, 0.3, 0.45));
      else if (/^https?:\/\/\S+$/.test(line)) drawLink(line); // 独立成行的网址 → 超链接
      else if (line.startsWith("- ") || line.startsWith("* ")) drawLine(`• ${line.slice(2).replace(/\*\*/g, "")}`, 10.5);
      else drawLine(line.replace(/\*\*/g, ""), 10.5);
    }

    // 页脚页码
    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawText(`- ${i + 1} / ${pages.length} -`, {
        x: pageSize[0] / 2 - 24,
        y: 26,
        size: 9,
        font,
        color: rgb(0.55, 0.6, 0.7),
      });
    });

    const bytes = await pdf.save();
    const artifact = await saveArtifact(ctx.missionId, "final_report.pdf", Buffer.from(bytes));
    return {
      summary: `已真实合成 final_report.pdf（A4 · ${pdf.getPageCount()} 页 · 内嵌中文字体），全部图文已打包`,
      payload: markdown,
      artifacts: [artifact],
      mode: "real",
    };
  } catch {
    // 字体下载失败时降级为自包含 HTML（同样是真实文件，可浏览器打印为 PDF）
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>交付报告</title>
<style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:40px auto;line-height:1.8;color:#1e293b;padding:0 20px}h1{color:#0e7490}h2{color:#155e75;border-left:4px solid #22d3ee;padding-left:10px}</style>
</head><body>${markdown
      .split("\n")
      .map((l) =>
        l.startsWith("# ") ? `<h1>${l.slice(2)}</h1>`
        : l.startsWith("## ") ? `<h2>${l.slice(3)}</h2>`
        : l.startsWith("- ") ? `<li>${l.slice(2)}</li>`
        : l.trim() ? `<p>${l}</p>` : ""
      )
      .join("")}</body></html>`;
    const artifact = await saveArtifact(ctx.missionId, "final_report.html", html);
    return {
      summary: `中文字体源暂不可达，已降级导出自包含网页版 final_report.html（浏览器打开后 Ctrl+P 可另存为 PDF）`,
      payload: markdown,
      artifacts: [artifact],
      mode: "real",
    };
  }
}

// ── 邮件专员：优先 Gmail OAuth，其次 SMTP，附带全部交付物 ──
async function sendEmail(ctx: ExecContext): Promise<ExecResult> {
  // 读取本次任务生成的全部文件作为附件
  const dir = path.join(GEN_DIR, ctx.missionId);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    /* 没有文件也允许发纯文本邮件 */
  }
  const summaryList = ctx.inputs.map((i) => `<li>${i.summary}</li>`).join("");
  const subject = `【任务交付】${topic(ctx.prompt)}`;
  const html = `<h2>📦 任务交付报告</h2>
<p><b>指令：</b>${ctx.prompt}</p>
<ul>${summaryList}</ul>
<p>共 ${files.length} 个附件，由 AI Agent Virtual Office 自动生成并发送。</p>`;

  // 方式一：用户已用 Google 账号登录 → 通过 Gmail API 代表本人发信
  if (ctx.gmailAuth?.refreshToken) {
    const attachments = await Promise.all(
      files.map(async (f) => ({
        filename: f,
        content: await fs.readFile(path.join(dir, f)),
      }))
    );
    await sendGmail(ctx.gmailAuth.refreshToken, {
      from: `AI Virtual Office <${ctx.gmailAuth.email}>`,
      to: ctx.gmailAuth.email,
      subject,
      html,
      attachments,
    });
    return {
      summary: `已通过你的 Gmail 账号（${ctx.gmailAuth.email}）真实发送交付邮件（含 ${files.length} 个附件），请查收`,
      mode: "real",
    };
  }

  // 方式二：SMTP 兜底
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.MAIL_TO || user;
  if (host && user && pass && to) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"AI Virtual Office" <${user}>`,
      to,
      subject,
      html,
      attachments: files.map((f) => ({ filename: f, path: path.join(dir, f) })),
    });
    return {
      summary: `已通过 SMTP 真实发送交付邮件至 ${to}（含 ${files.length} 个附件），请查收`,
      mode: "real",
    };
  }

  return {
    summary: `（模拟）成果已就绪但未真实发信 —— 点击右上角「邮箱登录」用 Google 账号授权后即可自动发送`,
    mode: "mock",
  };
}

// ── 工具注册表 ────────────────────────────────────
const TOOLS: Record<string, (ctx: ExecContext) => Promise<ExecResult>> = {
  "global-searcher": makeSearcher("global"),
  "local-searcher": makeSearcher("local"),
  "code-scout": githubSearch,
  "data-analyst": buildExcel,
  "script-runner": runStats,
  copywriter: writeReport,
  "presentation-designer": buildSlides,
  "image-generator": generateImage,
  "format-converter": exportPdf,
  "email-sender": sendEmail,
};

export async function executeTool(
  employeeId: string,
  ctx: ExecContext
): Promise<ExecResult> {
  const tool = TOOLS[employeeId];
  if (!tool) {
    return { summary: `${employeeId} 暂无对应工具实现`, mode: "mock" };
  }
  return tool(ctx);
}
