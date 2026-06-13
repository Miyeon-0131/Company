import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭左下角的 Next.js 开发指示器
  devIndicators: false,
  // 显式指定项目根目录，避免被用户主目录下的其他 lockfile 干扰
  turbopack: {
    root: __dirname,
  },
  // 这些包在服务端按原生 node_modules 方式加载，避免 Vercel 打包后运行失败
  serverExternalPackages: [
    "xlsx",
    "pptxgenjs",
    "nodemailer",
    "docx",
    "pdf-lib",
    "@pdf-lib/fontkit",
    "jszip",
  ],
  // 不把本地测试产物打进 Serverless 函数，防止体积超限
  outputFileTracingExcludes: {
    "*": ["./generated/**/*"],
  },
};

export default nextConfig;
