import { Department, EmployeeConfig } from "./types";

/**
 * 办公室布局总览（俯视图，X 向右，Z 向下）：
 *
 *   ┌───────────────────────────────────────┐
 *   │  情报收集部 (3 工位)   │  数据处理部 (2 工位) │   z = -4
 *   │ ──────────── 中 央 走 道 ──────────────  │
 *   │  内容创作部 (3 工位)   │ 后期与交付部 (2 工位) │   z = +4
 *   └───────────────────────────────────────┘
 */
export const DEPARTMENTS: Department[] = [
  {
    id: "intel",
    name: "情报收集部",
    englishName: "Information Retrieval Dept",
    color: "#22d3ee", // cyan
    center: [-6, -4],
    size: [9.5, 5.5],
  },
  {
    id: "data",
    name: "数据处理部",
    englishName: "Data & Logic Dept",
    color: "#a78bfa", // violet
    center: [6.25, -4],
    size: [7, 5.5],
  },
  {
    id: "content",
    name: "内容创作部",
    englishName: "Content Creation Dept",
    color: "#fbbf24", // amber
    center: [-6, 4],
    size: [9.5, 5.5],
  },
  {
    id: "delivery",
    name: "后期与交付部",
    englishName: "Production & Delivery Dept",
    color: "#34d399", // emerald
    center: [6.25, 4],
    size: [7, 5.5],
  },
];

export const EMPLOYEES: EmployeeConfig[] = [
  // ── 情报收集部 ──────────────────────────────
  {
    id: "global-searcher",
    name: "Google搜索专员",
    codename: "Global Searcher",
    departmentId: "intel",
    position: [-9.2, 0, -4],
    rotation: 0,
    shirtColor: "#0ea5e9",
    skinColor: "#fcd9b8",
    workingLabel: "🔍 正在谷歌搜索...",
    jobDescription: "负责外网资料、最新新闻、英文文献搜索",
  },
  {
    id: "local-searcher",
    name: "百度/微信搜索专员",
    codename: "Local Searcher",
    departmentId: "intel",
    position: [-6, 0, -4],
    rotation: 0,
    shirtColor: "#38bdf8",
    skinColor: "#f8c9a0",
    workingLabel: "🔎 正在聚合中文资料...",
    jobDescription: "负责国内行情、中文资料聚合",
  },
  {
    id: "code-scout",
    name: "Github分析师",
    codename: "Code Scout",
    departmentId: "intel",
    position: [-2.8, 0, -4],
    rotation: 0,
    shirtColor: "#0891b2",
    skinColor: "#fcd9b8",
    workingLabel: "🐙 正在扒开源代码...",
    jobDescription: "负责扒开源代码和技术文档",
  },

  // ── 数据处理部 ──────────────────────────────
  {
    id: "data-analyst",
    name: "Excel表姐",
    codename: "Data Analyst",
    departmentId: "data",
    position: [4.6, 0, -4],
    rotation: 0,
    shirtColor: "#8b5cf6",
    skinColor: "#f8c9a0",
    workingLabel: "📊 正在清洗数据...",
    jobDescription: "负责清洗数据，将文本转为 CSV/Excel 表格结构",
  },
  {
    id: "script-runner",
    name: "Python工程师",
    codename: "Script Runner",
    departmentId: "data",
    position: [7.9, 0, -4],
    rotation: 0,
    shirtColor: "#7c3aed",
    skinColor: "#fcd9b8",
    workingLabel: "🐍 正在运行脚本...",
    jobDescription: "负责写小脚本处理爬虫数据或复杂计算",
  },

  // ── 内容创作部 ──────────────────────────────
  {
    id: "copywriter",
    name: "Word主笔",
    codename: "Copywriter",
    departmentId: "content",
    position: [-9.2, 0, 4],
    rotation: Math.PI,
    shirtColor: "#f59e0b",
    skinColor: "#f8c9a0",
    workingLabel: "📝 疯狂码字中...",
    jobDescription: "负责撰写长文、润色总结、生成 Markdown 或 Word 文档",
  },
  {
    id: "presentation-designer",
    name: "PPT大师",
    codename: "Presentation Designer",
    departmentId: "content",
    position: [-6, 0, 4],
    rotation: Math.PI,
    shirtColor: "#fb923c",
    skinColor: "#fcd9b8",
    workingLabel: "📑 正在排版幻灯片...",
    jobDescription: "负责提炼大纲，生成幻灯片结构",
  },
  {
    id: "image-generator",
    name: "AI美术",
    codename: "Image Generator",
    departmentId: "content",
    position: [-2.8, 0, 4],
    rotation: Math.PI,
    shirtColor: "#f97316",
    skinColor: "#f8c9a0",
    workingLabel: "🎨 正在生成插画...",
    jobDescription: "负责根据文本配图、生成插画（Midjourney/DALL-E）",
  },

  // ── 后期与交付部 ────────────────────────────
  {
    id: "format-converter",
    name: "PDF打包员",
    codename: "Format Converter",
    departmentId: "delivery",
    position: [4.6, 0, 4],
    rotation: Math.PI,
    shirtColor: "#10b981",
    skinColor: "#fcd9b8",
    workingLabel: "📦 正在导出 PDF...",
    jobDescription: "负责将所有图文、Word 合并并导出为标准化 PDF",
  },
  {
    id: "email-sender",
    name: "邮件专员",
    codename: "Email Sender",
    departmentId: "delivery",
    position: [7.9, 0, 4],
    rotation: Math.PI,
    shirtColor: "#059669",
    skinColor: "#f8c9a0",
    workingLabel: "📨 正在发送邮件...",
    jobDescription: "负责将最终成果以邮件形式发送给老板或指定客户",
  },
];

export const getDepartment = (id: string): Department =>
  DEPARTMENTS.find((d) => d.id === id)!;
