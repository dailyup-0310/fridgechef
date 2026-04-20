"use client";

import { motion } from "framer-motion";
import { ChefHat, Salad } from "lucide-react";
import { Mode } from "@/types/preference";
import { MODE_CONFIG } from "@/features/mode/mode-config";

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODE_ICONS: Record<Mode, React.ReactNode> = {
  daily: <ChefHat size={15} />,
  diet: <Salad size={15} />,
};

export function ModeSwitch({ mode, onChange }: Props) {
  const modes: Mode[] = ["daily", "diet"];

  return (
    <div className="w-full bg-surface p-1.5 rounded-[2rem] flex gap-1">
      {modes.map((m) => {
        const config = MODE_CONFIG[m];
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className="relative flex-1 py-2.5 rounded-[1.6rem] text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
          >
            {active && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 rounded-[1.6rem] bg-accent shadow-clay-btn"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-200 ${active ? "text-white" : "text-accent-muted"}`}>
              {MODE_ICONS[m]}
              <span>{config.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
