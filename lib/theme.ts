import { create } from "zustand";

export type Theme = "dark" | "light";

const THEME_KEY = "office-theme";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** 从 localStorage 读取用户上次选择 */
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, theme);
  },

  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

  hydrate: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") set({ theme: saved });
  },
}));

/** 每种主题对应的 3D 场景配色 */
export const SCENE_THEME: Record<
  Theme,
  {
    background: string;
    fog: [string, number, number];
    ambient: number;
    dirLight: number;
    point1: string;
    point2: string;
    showStars: boolean;
  }
> = {
  dark: {
    background: "#070b16",
    fog: ["#070b16", 55, 110],
    ambient: 0.55,
    dirLight: 1.6,
    point1: "#818cf8",
    point2: "#22d3ee",
    showStars: true,
  },
  light: {
    background: "#dfe9f5",
    fog: ["#dfe9f5", 60, 130],
    ambient: 1.05,
    dirLight: 2.0,
    point1: "#bae6fd",
    point2: "#a5b4fc",
    showStars: false,
  },
};
