import path from "node:path";

/** 任务产物目录：Vercel 仅 /tmp 可写，本地用项目根 generated/ */
export function generatedDir() {
  if (process.env.VERCEL) return path.join("/tmp", "generated");
  return path.join(process.cwd(), "generated");
}
