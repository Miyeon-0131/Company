import { UserConfig } from "./types";

const CONFIG_KEY = "virtual-office-config";

/** 从浏览器 localStorage 读取用户授权配置 */
export function loadConfig(): UserConfig {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "{}") as UserConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: UserConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/** 各集成的授权状态（用于设置面板状态灯） */
export function integrationStatus(config: UserConfig) {
  return {
    openai: !!config.openaiKey,
    search: !!config.tavilyKey,
    github: !!config.githubToken,
    email: !!(config.email && config.smtpHost && config.smtpUser && config.smtpPass),
  };
}
