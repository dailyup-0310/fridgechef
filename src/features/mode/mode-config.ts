import { Mode } from "@/types/preference";

export interface ModeConfig {
  label: string;
  emoji: string;
  description: string;
}

export const MODE_CONFIG: Record<Mode, ModeConfig> = {
  daily: {
    label: "Daily Mode",
    emoji: "🍳",
    description: "Turn your fridge ingredients into a great meal",
  },
  diet: {
    label: "Diet Mode",
    emoji: "🥗",
    description: "Control calories, eat healthy",
  },
};
