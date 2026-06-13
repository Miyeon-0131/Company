# AI Agent Virtual Office

具象化的多智能体工作台：一个 3D 等距视角的虚拟公司。你是 CEO，输入自然语言任务，系统将任务拆解并分发给办公室里的 10 位 AI 员工，员工在后台真正执行任务的同时，在 3D 场景中实时播放状态动画。

## 技术栈

- **Next.js** (App Router) + **Tailwind CSS**
- **Three.js / React-Three-Fiber / Drei**（Low-poly 风格）
- **Zustand**（后台 Agent 状态 ↔ 3D 前台动画同步）
- LangChain.js / OpenAI Functions（任务拆解与路由，后续接入）

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000，拖拽旋转视角，点击任意员工可循环切换其状态（idle → thinking → working → done）。

## 目录结构

```
app/
  page.tsx              # 入口页面 + HUD 覆盖层
components/three/
  OfficeScene.tsx       # Canvas、相机、光照、等距视角控制
  Office.tsx            # 办公室布局：地板、部门分区、10 个工位
  Employee.tsx          # 员工组件：低多边形小人 + 状态驱动动画
  Desk.tsx              # 工位：办公桌、电脑、键盘、咖啡杯、绿植
  StatusBubble.tsx      # 头顶 Html 状态气泡 + 职位名牌
lib/
  types.ts              # AgentStatus / EmployeeConfig 等类型
  employees.ts          # 公司花名册：4 个部门、10 位员工配置
  store.ts              # Zustand 状态仓库
```

## 接入真实 LLM（可选）

复制 `.env.local.example` 为 `.env.local` 并填入 `OPENAI_API_KEY`，
"项目经理"即会调用 OpenAI 智能拆解任务依赖图；不配置则使用本地规则引擎，
完整演示流程不受影响。各员工的工具在 `lib/tools.ts` 中均为 Mock 实现，
已预留真实 API 接入点（搜索、Excel、PDF、邮件等）。

## 开发进度

- [x] Step 1: R3F 基础场景 + 等距视角相机
- [x] Step 2: Employee 组件（状态动画 + Html 气泡）
- [x] Step 3: 办公室布局（4 部门 × 10 工位）+ 会议室/茶水间生态
- [x] Step 4: Zustand 任务分发（`assignTask` / mission / 日志流）
- [x] Step 5: 底部 CEO 指令终端（输入 + 实时日志）
- [x] Step 6: AgentManager（LLM/规则拆解 → 依赖图并行调度 → 交付报告弹窗）
