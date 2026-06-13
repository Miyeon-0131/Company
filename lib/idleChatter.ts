/** 各岗位待机台词（仅与职务相关） */

const ROLE_CHATTER: Record<string, string[]> = {
  "global-searcher": [
    "🔍 Google 高级搜索支持 site:、filetype: 等运算符",
    "🌐 英文文献优先查 Google Scholar 和 arXiv",
    "📰 外网资讯建议用英文关键词，命中率更高",
    "🔎 刚整理了 12 个权威信源，等任务来就能搜",
    "📡 实时检索 API 已就绪，Tavily 通道畅通",
    "🗞️ 全球新闻按时间线排序比关键词堆叠更清晰",
  ],
  "local-searcher": [
    "🔎 中文资料我会优先聚合公众号、知乎和行情站",
    "🇨🇳 国内搜索要注意同义词：新能源车 = 电动汽车",
    "📱 微信生态的信息往往比网页更新更快",
    "📊 中文研报摘要我已准备好抓取模板",
    "🗂️ 百度指数可以辅助判断话题热度趋势",
    "📌 地域性政策文件记得加「省/市」限定词",
  ],
  "code-scout": [
    "⭐ GitHub Trending 按天刷新，适合找新兴框架",
    "🐙 搜仓库用 stars:>1000 可以过滤掉玩具项目",
    "💻 开源协议 SPDX 标识很重要，交付前我会标注",
    "🔧 技术选型要看 commit 频率，不只是 star 数",
    "📦 npm 与 PyPI 下载量也是健康度参考指标",
    "🧩 README 质量往往决定一个项目能不能落地",
  ],
  "data-analyst": [
    "📊 结构化表格用首行字段名，方便后续透视分析",
    "📈 时间序列数据最好统一成 YYYY-MM 格式",
    "🔢 异常值要先标注再删除，留审计痕迹",
    "📉 对比表建议加「同比/环比」两列一目了然",
    "🧮 Excel 单表建议不超过 5 万行，性能更稳",
    "📋 多来源数据合并前先做字段映射表",
  ],
  "script-runner": [
    "🐍 词频统计前我会统一大小写并去掉停用词",
    "⚙️ 批处理脚本已写好模板，来数据就能跑",
    "🧪 JSON 输出方便下游 Word 和 PPT 引用",
    "📐 正则清洗电话、邮箱有专用规则包",
    "🔄 流水线支持增量更新，不用每次全量重算",
    "🐚 长文本分析我会先分句再统计，更准确",
  ],
  copywriter: [
    "📝 报告建议结构：摘要 → 现状 → 发现 → 建议",
    "✍️ 引用来源我会用脚注格式，方便溯源",
    "📄 Word 交付默认宋体/微软雅黑，正式场合更稳",
    "📑 长报告会加目录页，老板翻阅更省力",
    "✏️ 数据图表描述和正文我会分开写，逻辑更清",
    "📚 专业术语首次出现会附简短解释",
  ],
  "presentation-designer": [
    "🎨 PPT 一页只讲一个观点，字号不小于 18pt",
    "📽️ 封面、目录、结论页我会固定模板化",
    "🖼️ 图表页留白要够，别堆满文字",
    "📊 数据页用对比色突出关键数字",
    "🔗 参考来源页支持点击跳转原文",
    "🎯 汇报型 PPT 控制在 15 页内节奏最好",
  ],
  "image-generator": [
    "🖌️ 封面插画我会避免文字，防止 AI 乱码",
    "🎨 商务风推荐深蓝 + 渐变紫，稳重又现代",
    "🌈 配图分辨率默认 1024，印刷需另导出",
    "🖼️ 扁平矢量风格更适合报告封面",
    "✨ 提示词越具体，构图越贴近报告主题",
    "🎭 人物图容易踩版权，抽象图形更安全",
  ],
  "format-converter": [
    "📦 PDF 会内嵌中文字体，避免打开乱码",
    "📄 A4 页边距我设成 2cm，打印友好",
    "🗜️ 多附件合并时会保留原始文件名",
    "🔗 PDF 里的网址我会做成可点击超链接",
    "📑 图文混排会先检查分页，避免标题孤行",
    "🖨️ 导出前会压缩图片，文件体积更合理",
  ],
  "email-sender": [
    "📨 邮件主题格式：【任务交付】+ 任务简称",
    "✉️ 附件过大时我会建议改用网盘链接",
    "📬 HTML 正文会排好列表，手机端也能读",
    "🔐 Gmail OAuth 发信比 SMTP 配置更省心",
    "📎 多文件交付会打包 zip 再发，一次下载",
    "⏰ 发送前我会核对收件人，避免误发",
  ],
};

const FALLBACK = ["☕ 待机中，等待新任务…"];

/** 接话模板：听到某岗位同事发言后的附和/补充（第二人专用） */
const REPLY_TO_PRIMARY: Record<string, string[]> = {
  "global-searcher": [
    "是啊，外网检索记得交叉验证才靠谱",
    "没错，Google Scholar 确实适合找论文",
    "对啊，英文关键词得先想好同义词",
    "是啊，实时资讯我会帮你跟进的",
  ],
  "local-searcher": [
    "是啊，中文语境下用词差别挺大的",
    "没错，公众号往往比网页更新快",
    "对啊，国内政策得加地域限定词",
    "是啊，我这边也能补一份中文摘要",
  ],
  "code-scout": [
    "是啊，star 数高不代表能直接上生产",
    "没错，开源协议交付前必须标清楚",
    "对啊，commit 频率更能看项目活不活跃",
    "是啊，README 写得好省我们很多功夫",
  ],
  "data-analyst": [
    "是啊，字段名统一了我才好写报告",
    "没错，同比环比两列老板最爱看",
    "对啊，异常值标注留痕很重要",
    "是啊，表格结构化后我 PPT 也好做",
  ],
  "script-runner": [
    "是啊，词频统计结果我正好能引用",
    "没错，JSON 输出下游接起来很方便",
    "对啊，清洗规则统一了数据才准",
    "是啊，增量跑批确实省不少时间",
  ],
  copywriter: [
    "是啊，摘要写清楚了我邮件好发",
    "没错，脚注溯源老板抽查也不怕",
    "对啊，目录页加上翻阅体验好很多",
    "是啊，正文和图表分开逻辑更顺",
  ],
  "presentation-designer": [
    "是啊，一页一观点观众才不会晕",
    "没错，结论页留白多点更有力",
    "对啊，来源页可点击真的很加分",
    "是啊，15 页以内节奏刚刚好",
  ],
  "image-generator": [
    "是啊，封面无字确实能避免乱码",
    "没错，深蓝紫渐变商务感拉满了",
    "对啊，扁平矢量放报告里很体面",
    "是啊，抽象图形比人物图安全多了",
  ],
  "format-converter": [
    "是啊，PDF 内嵌字体不然中文会空白",
    "没错，可点击链接交付体验好太多",
    "对啊，页边距留够打印才不难看",
    "是啊，打包 zip 发邮件最省事",
  ],
  "email-sender": [
    "是啊，主题格式统一老板一眼能认",
    "没错，附件太大确实该走网盘",
    "对啊，发前核对收件人太重要了",
    "是啊，HTML 排版好手机也能看",
  ],
};

const GENERIC_REPLIES = [
  "是啊，这条经验挺实用的",
  "没错，咱们配合起来效率更高",
  "对啊，等老板派活就能串起来",
  "是啊，上下游衔接好交付才顺",
];

export interface IdleChatterTurn {
  lead: { speakerId: string; text: string };
  reply?: { speakerId: string; text: string };
}

/** 取某岗位的第 n 条职务相关台词 */
export function getRoleChatter(employeeId: string, index: number): string {
  const lines = ROLE_CHATTER[employeeId] ?? FALLBACK;
  return lines[index % lines.length]!;
}

/** 第二人接话：针对主发言人的岗位生成附和句 */
export function getReplyChatter(
  primaryId: string,
  responderId: string,
  index: number
): string {
  void responderId; // 预留按接话人微调语气
  const pool = REPLY_TO_PRIMARY[primaryId] ?? GENERIC_REPLIES;
  return pool[index % pool.length]!;
}

export const IDLE_CHATTER_SHOW_MS = 3000;
export const IDLE_CHATTER_GAP_MS = 5000;
