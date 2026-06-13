/** Agent 的四种实时状态 */
export type AgentStatus = "idle" | "thinking" | "working" | "done";

/** 子任务执行状态 */
export type SubTaskStatus = "pending" | "thinking" | "running" | "done";

/** 任务执行产出的文件（可下载） */
export interface Artifact {
  name: string;
  url: string;
}

/** 项目经理拆解出的子任务（依赖图节点） */
export interface SubTask {
  id: string;
  employeeId: string;
  /** 带 emoji 的简短任务名，会显示在员工头顶气泡上 */
  title: string;
  /** 依赖的前置子任务 id（全部完成后才会启动） */
  dependsOn: string[];
  status: SubTaskStatus;
  /** 执行产出（工具返回结果摘要） */
  output?: string;
  /** 产出的可下载文件 */
  artifacts?: Artifact[];
  /** real = 真实 API/文件执行，mock = 未授权时的模拟降级 */
  mode?: "real" | "mock";
}

/** 用户在设置面板中填写的授权信息（仅存浏览器 localStorage，请求时直传后端使用） */
export interface UserConfig {
  /** OpenAI Key：任务拆解 / 撰写报告 / 生成插画 */
  openaiKey?: string;
  /** Tavily Key：真实联网搜索 */
  tavilyKey?: string;
  /** GitHub Token：提高 API 限额（不填也能匿名搜索） */
  githubToken?: string;
  /** 接收交付邮件的邮箱 */
  email?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  /** SMTP 授权码（非登录密码） */
  smtpPass?: string;
}

export type MissionStatus = "planning" | "running" | "done";

/** 一次完整的全局任务 */
export interface Mission {
  id: string;
  prompt: string;
  status: MissionStatus;
  tasks: SubTask[];
  /** 拆解来源：llm = 真实大模型，mock = 本地规则引擎 */
  plannerSource?: "llm" | "mock";
  finalReport?: string;
}

/** 指令终端的日志条目 */
export interface LogEntry {
  id: number;
  time: string;
  source: string;
  text: string;
  kind: "system" | "manager" | "agent" | "done";
}

/** 员工"电脑屏幕"上的一条记录 */
export interface ScreenEntry {
  id: number;
  time: string;
  /** action=执行动作 result=产出摘要 link=可点击网页 artifact=可下载文件 */
  kind: "action" | "result" | "link" | "artifact";
  text: string;
  url?: string;
}

/** 部门定义 */
export interface Department {
  id: string;
  name: string;
  englishName: string;
  /** 部门主题色（用于地毯、隔板、UI 标签） */
  color: string;
  /** 部门区域中心 [x, z] */
  center: [number, number];
  /** 区域尺寸 [宽, 深] */
  size: [number, number];
}

/** 员工（Worker Agent）的静态配置 */
export interface EmployeeConfig {
  id: string;
  /** 职位名称（中文） */
  name: string;
  /** Agent 代号（英文） */
  codename: string;
  departmentId: string;
  /** 工位在办公室中的位置 [x, y, z] */
  position: [number, number, number];
  /** 工位朝向（绕 Y 轴旋转，弧度） */
  rotation: number;
  /** 衣服颜色 */
  shirtColor: string;
  /** 肤色 */
  skinColor: string;
  /** 默认工作中文案，例如 "🔍 正在谷歌搜索..." */
  workingLabel: string;
  /** 该 Agent 的职责描述（后续接入 LLM 路由时作为工具描述） */
  jobDescription: string;
}
