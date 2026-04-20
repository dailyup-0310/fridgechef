import { Mode } from "@/types/preference";

export interface ModeConfig {
  label: string;
  emoji: string;
  description: string;
}

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  daily: {
    label: "日常模式",
    emoji: "🍳",
    description: "用冰箱里的食材，做一顿好饭",
  },
  diet: {
    label: "减脂模式",
    emoji: "🥗",
    description: "控制热量，吃得健康",
  },
};
