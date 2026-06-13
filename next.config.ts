import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭左下角的 Next.js 开发指示器
  devIndicators: false,
  // 显式指定项目根目录，避免被用户主目录下的其他 lockfile 干扰
  turbopack: {
    root: __dirname,
  },
  // 这些包在服务端按原生 node_modules 方式加载，避免打包兼容问题
  serverExternalPackages: ["xlsx", "pptxgenjs", "nodemailer", "docx"],
};

export default nextConfig;
