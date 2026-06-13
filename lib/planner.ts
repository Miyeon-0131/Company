import { SubTask } from "./types";

/**
 * 本地规则版"项目经理"：根据指令关键词拆解任务依赖图。
 * 未配置 OPENAI_API_KEY 或 LLM 调用失败时的兜底方案。
 */
export function planWithRules(prompt: string): SubTask[] {
  const p = prompt.toLowerCase();
  const has = (...keywords: string[]) =>
    keywords.some((k) => p.includes(k.toLowerCase()));

  const tasks: SubTask[] = [];
  const add = (employeeId: string, title: string, dependsOn: string[]) => {
    const id = `t${tasks.length + 1}`;
    tasks.push({ id, employeeId, title, dependsOn, status: "pending" });
    return id;
  };

  // ── 阶段 1：情报收集（并行） ──────────────────
  const intel: string[] = [];
  intel.push(add("global-searcher", "🔍 检索全球资讯与英文文献", []));
  intel.push(add("local-searcher", "🔎 聚合国内中文资料与行情", []));
  if (has("github", "开源", "代码", "框架", "技术选型", "仓库")) {
    intel.push(add("code-scout", "🐙 分析 GitHub 开源仓库", []));
  }

  // ── 阶段 2：数据处理 ─────────────────────────
  const data: string[] = [];
  if (has("数据", "表格", "excel", "csv", "统计", "图表", "整理")) {
    data.push(add("data-analyst", "📊 清洗数据并生成 Excel", intel));
  }
  if (has("python", "脚本", "爬虫", "爬取", "计算")) {
    data.push(add("script-runner", "🐍 编写脚本处理数据", intel));
  }
  const afterData = data.length ? data : intel;

  // ── 阶段 3：内容创作 ─────────────────────────
  const content: string[] = [];
  // 默认总要有人写报告，否则没有可交付物
  content.push(add("copywriter", "📝 撰写调研报告文档", afterData));
  if (has("ppt", "幻灯", "演示", "路演", "汇报")) {
    content.push(add("presentation-designer", "📑 制作幻灯片大纲", afterData));
  }
  if (has("图", "插画", "配图", "海报", "视觉", "封面")) {
    content.push(add("image-generator", "🎨 生成配图与插画", afterData));
  }

  // ── 阶段 4：后期与交付 ───────────────────────
  const pdfId = add("format-converter", "📦 合并导出标准化 PDF", content);
  add("email-sender", "📨 发送交付邮件给老板", [pdfId]);

  return tasks;
}
