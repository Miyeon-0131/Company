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

/** 补充式接话：不说「是啊」，而是顺势延展 */
const EXPAND_TO_PRIMARY: Record<string, string[]> = {
  "global-searcher": [
    "另外，多源交叉验证能少踩坑",
    "补充一下，检索结果我会标可信度",
    "顺带一提，外文摘要我可以帮忙翻",
  ],
  "local-searcher": [
    "另外，中文同义词表我也备好了",
    "补充一下，地域词我会单独建字段",
    "顺带一提，公众号链接能一并归档",
  ],
  "code-scout": [
    "另外，许可证不合规的我会在清单里标红",
    "补充一下，依赖版本我也会顺手查",
    "顺带一提，示例代码我会挑 star 高的",
  ],
  "data-analyst": [
    "另外，透视表模板我已经搭好了",
    "补充一下，空值我会统一标 NA",
    "顺带一提，图表数据我会另存一表",
  ],
  "script-runner": [
    "另外，日志我会按步骤落盘",
    "补充一下，异常行会单独导出",
    "顺带一提，批处理支持断点续跑",
  ],
  copywriter: [
    "另外，Executive Summary 我会先写",
    "补充一下，引用格式按国标来",
    "顺带一提，术语表可以附在附录",
  ],
  "presentation-designer": [
    "另外，动画我只用在关键页",
    "补充一下，配色会跟封面统一",
    "顺带一提，备注区留给演讲提示",
  ],
  "image-generator": [
    "另外，导出我会留 PNG 和 WebP 两份",
    "补充一下，构图留白方便后期加字",
    "顺带一提，风格参考我会存 moodboard",
  ],
  "format-converter": [
    "另外，书签目录我会自动生成",
    "补充一下，图片会压到 150dpi",
    "顺带一提，合并前会跑一遍字体检查",
  ],
  "email-sender": [
    "另外，抄送列表我会单独确认",
    "补充一下，大附件走云链更稳",
    "顺带一提，退信我会立刻告警",
  ],
};

const GENERIC_EXPANDS = [
  "另外，这条流程上下游都能接上",
  "补充一下，交付前我会再过一遍",
  "顺带一提，有任务随时喊我",
];

/** 单人随口感慨（短句、轻松） */
const SOLO_QUIPS = [
  "☕ 工具都就绪了，就等派活",
  "🌤️ 办公室今天挺安静的",
  "📋  checklist 过了一遍，没漏项",
  "💤 待机省电模式… 有活立刻醒",
  "🎧 白噪音开着，进入工作心流",
  "🗂️ 模板库整理好了，随时能抄",
];

export type ChatterMode = "solo" | "reply" | "expand" | "quip";

export interface IdleChatterTurn {
  lead: { speakerId: string; text: string };
  reply?: { speakerId: string; text: string };
}

/** 按轮次决定说话方式：常单人，偶尔双人接话或补充 */
export function pickChatterMode(turnIdx: number, idleCount: number): ChatterMode {
  if (idleCount < 2) {
    return turnIdx % 4 === 0 ? "quip" : "solo";
  }
  const roll = (turnIdx * 7 + idleCount * 3) % 10;
  if (roll < 5) return "solo";
  if (roll < 7) return "reply";
  if (roll < 9) return "expand";
  return "quip";
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

/** 第二人补充：顺势延展，不用「是啊」开头 */
export function getExpandChatter(
  primaryId: string,
  responderId: string,
  index: number
): string {
  void responderId;
  const pool = EXPAND_TO_PRIMARY[primaryId] ?? GENERIC_EXPANDS;
  return pool[index % pool.length]!;
}

/** 单人随口感慨 */
export function getQuipChatter(index: number): string {
  return SOLO_QUIPS[index % SOLO_QUIPS.length]!;
}

/** 从台词池取下一句，尽量避免短期内重复 */
export function pickNonRepeatingLine(
  pool: string[],
  state: { cursor: number; recent: string[] },
  recentCap = 5
): string {
  if (!pool.length) return "";
  const fresh = pool.filter((line) => !state.recent.includes(line));
  const choices = fresh.length > 0 ? fresh : pool;
  const line = choices[state.cursor % choices.length]!;
  state.cursor = (state.cursor + 1) % Math.max(choices.length, 1);
  state.recent = [...state.recent, line].slice(-Math.min(recentCap, pool.length - 1));
  return line;
}

export const IDLE_CHATTER_SHOW_MS = 10000;
export const IDLE_CHATTER_REPLY_DELAY_MS = 3000;
export const IDLE_CHATTER_GAP_MS = 6000;

/** 会议/休息区：更短间隔，对话更连续 */
export const AREA_CHATTER_SHOW_MS = 7500;
export const AREA_CHATTER_REPLY_DELAY_MS = 2200;
export const AREA_CHATTER_GAP_MS = 2800;

export type ChatterScene = "desk" | "meeting" | "break";

/** 会议相关台词 */
const MEETING_LINES = [
  "📋 今天议题先过一遍优先级，别散会还定不下来",
  "🎯 这个需求的核心指标是什么？先对齐再拆任务",
  "⏱️ 专注 25 分钟，中间不刷手机，有问题记便签",
  "📊 数据口径要先统一，不然报告会对不上",
  "🧩 上下游依赖谁阻塞了？我们逐个清掉",
  "✅ 结论页写三条：现状、风险、下一步",
  "💡 我这边可以补一版竞品对比，会后再同步",
  "🔗 交付物格式定一下：Word + Excel + PDF",
  "📌 谁负责对外沟通？邮件主题格式也统一",
  "🗣️ 有异议现在提，别等到发版前夜",
  "📝 会议纪要我来记，谁有补充现在说",
  "🧭 本周里程碑还剩两个，今天能关一个吗",
  "🔍 竞品那栏数据谁核实过？来源要标注",
  "📆 排期里测试窗口留够了吗，别压缩验收",
  "🧠 创意方案先各写三条，再投票收敛",
  "🛠️ 技术债这周还一点，不然后面更痛",
  "📣 对外口径统一一下，别各说各的",
  "🤝 需要协同的部门我会后拉群",
  "📎 参考材料我整理到共享盘了",
  "⏳ 超时议题先搁置，别拖垮主线",
];

const MEETING_REPLIES = [
  "同意，先把目标对齐再动手",
  "对，指标口径不统一后面全得返工",
  "我记下了，专注时段不处理杂事",
  "可以，结论三条我负责整理",
  "我这边依赖已清，能接下一项",
  "没问题，会后再把附件打包发你",
  "补充一点：风险项也要写进纪要",
  "我赞成，先收敛范围再谈细节",
  "测试那边我刚问过，窗口够",
  "来源我来核对，今天下班前给",
  "排期我回去更新一版甘特",
  "可以，创意三条我下午发",
];

/** 休息区台词（按活动类型） */
const BREAK_BY_ACTIVITY: Record<string, string[]> = {
  sofa: [
    "🛋️ 沙发这角度正好，歇两分钟回工位更有劲",
    "😌 今天会议密度挺高，躺一会儿不算摸鱼吧",
    "📱 刷两条消息就放下，别带进下一波任务",
  ],
  coffee: [
    "☕ 这杯浓度刚好，下午写报告靠它了",
    "🫖 咖啡机今天挺给面子，没出幺蛾子",
    "☕ 来杯热的，脑子才能从会议模式切出来",
  ],
  vending: [
    "🥤 纠结喝可乐还是乌龙茶… 选健康的吧",
    "🧊 冰饮一口下去，专注时段的疲劳能缓一半",
    "🥤 饮料区今天补货了，运气不错",
  ],
  water: [
    "💧 多喝水是对的，敲键盘容易忘",
    "🚰 接水顺便活动下颈椎",
    "💧 休息区最划算的项目：免费白开水",
  ],
  microwave: [
    "🍱 便当热好了，香味把隔壁都招来了",
    "⏲️ 微波炉还有 30 秒，站这儿发呆也算休息",
    "🍜 热饭的时候别聊工作，让脑子空一下",
  ],
  lounge: [
    "📖 站这儿吹风，比工位透气",
    "🌿 休息区灯光舒服，适合放空",
    "🧘 伸个懒腰，肩颈终于松点了",
  ],
};

const BREAK_GENERIC = [
  "😄 休息五分钟，效率能顶半小时",
  "🎵 远处好像有人在聊昨晚的球赛",
  "🌤️ 窗外天色不错，适合摸鱼… 不是，充电",
  "☕ 谁要一起点外卖？开玩笑的，还得赶交付",
];

const BREAK_REPLIES = [
  "哈哈，歇会儿应该的",
  "是啊，别聊太嗨，一会还得回工位",
  "同意，充电五分钟继续冲",
  "行，我这边也快好了",
  "确实，站着接水比坐着像样",
  "沙发那位别羡慕，我这也快好了",
  "等会回工位别迟到啊",
  "这咖啡味挺香，借我闻闻",
];

/** 会议/休息区：更常双人对话，输出更密 */
export function pickAreaChatterMode(
  turnIdx: number,
  speakerCount: number,
  scene: ChatterScene
): ChatterMode {
  if (speakerCount < 2) return turnIdx % 3 === 0 ? "quip" : "solo";
  const roll = (turnIdx * 5 + speakerCount * 2) % 10;
  if (scene === "meeting") {
    if (roll < 3) return "solo";
    if (roll < 6) return "reply";
    if (roll < 8) return "expand";
    return "quip";
  }
  if (roll < 4) return "solo";
  if (roll < 7) return "reply";
  return "expand";
}

export function getMeetingChatter(index: number): string {
  return MEETING_LINES[index % MEETING_LINES.length]!;
}

export function getMeetingReply(index: number): string {
  return MEETING_REPLIES[index % MEETING_REPLIES.length]!;
}

export function getMeetingLinePool(): string[] {
  return MEETING_LINES;
}

export function getMeetingReplyPool(): string[] {
  return MEETING_REPLIES;
}

export function getBreakLinePool(activity: string | null | undefined): string[] {
  if (activity && BREAK_BY_ACTIVITY[activity]) {
    return BREAK_BY_ACTIVITY[activity];
  }
  return BREAK_GENERIC;
}

export function getBreakReplyPool(): string[] {
  return BREAK_REPLIES;
}

export function getBreakChatter(
  activity: string | null | undefined,
  index: number
): string {
  const pool = getBreakLinePool(activity);
  return pool[index % pool.length]!;
}

export function getBreakReply(index: number): string {
  return BREAK_REPLIES[index % BREAK_REPLIES.length]!;
}
