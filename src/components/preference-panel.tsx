"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { Mode, DailyPreferences, DietPreferences } from "@/types/preference";

interface Props {
  mode: Mode;
  preferences: DailyPreferences | DietPreferences;
  onChange: (prefs: DailyPreferences | DietPreferences) => void;
}

interface ChipGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onSelect: (v: string | undefined) => void;
}

function ChipGroup({ label, options, value, onSelect }: ChipGroupProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-theme-muted uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onSelect(active ? undefined : opt.value)}
              whileTap={{ scale: 0.92 }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                active
                  ? "bg-accent border-accent text-white shadow-clay-sm"
                  : "bg-white border-theme text-theme-muted hover:border-accent hover:text-accent"
              }`}
              style={active ? {} : { borderColor: "var(--c-border)" }}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "早餐" },
  { value: "main", label: "正餐" },
];


const CUISINE_OPTIONS = [
  { value: "中餐", label: "中餐" },
  { value: "西餐", label: "西餐" },
  { value: "日餐", label: "日餐" },
  { value: "韩餐", label: "韩餐" },
];

const FLAVOR_OPTIONS = [
  { value: "清淡", label: "清淡" },
  { value: "适中", label: "适中" },
  { value: "重口", label: "重口" },
];

export function PreferencePanel({ mode, preferences, onChange }: Props) {
  function patch(key: string, value: string | number | undefined) {
    onChange({ ...preferences, [key]: value } as DailyPreferences & DietPreferences);
  }

  const prefs = preferences as DailyPreferences & DietPreferences;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-theme flex items-center gap-2">
        <SlidersHorizontal size={17} className="text-accent" />
        偏好设置
        <span className="font-normal text-accent-muted text-sm opacity-70">（可选）</span>
      </h2>

      <div className="space-y-4">
        <ChipGroup label="餐别" options={MEAL_TYPE_OPTIONS} value={prefs.mealType} onSelect={(v) => patch("mealType", v)} />
        {/* Cook time slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wide">做饭时长</span>
            <span className="text-xs font-bold text-theme">
              {prefs.cookTime ? `${prefs.cookTime} 分钟` : "—"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={Number(prefs.cookTime ?? 0)}
            onChange={(e) => {
              const v = Number(e.target.value);
              patch("cookTime", v === 0 ? undefined : String(v));
            }}
            className="w-full h-2 rounded-full cursor-pointer appearance-none bg-surface"
            style={{ accentColor: "var(--c-accent)" }}
          />
          <div className="flex justify-between text-[10px] text-theme-muted select-none">
            <span>0</span>
            <span>1 小时</span>
            <span>2 小时</span>
            <span>3 小时</span>
          </div>
        </div>

        {mode === "daily" && (
          <>
            <ChipGroup label="菜系" options={CUISINE_OPTIONS} value={prefs.cuisine} onSelect={(v) => patch("cuisine", v)} />
            <ChipGroup label="口味" options={FLAVOR_OPTIONS} value={prefs.flavor} onSelect={(v) => patch("flavor", v)} />
          </>
        )}

        {mode === "diet" && (
          <>
          <ChipGroup label="菜系" options={CUISINE_OPTIONS} value={prefs.cuisine} onSelect={(v) => patch("cuisine", v)} />
          <div className="space-y-2">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wide">热量目标</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={2000}
                placeholder="如：500"
                value={prefs.calorieTarget ?? ""}
                onChange={(e) => patch("calorieTarget", e.target.value ? Number(e.target.value) : undefined)}
                className="w-32 h-11 px-4 text-sm border rounded-2xl bg-white shadow-clay-sm text-theme placeholder:text-accent-muted placeholder:opacity-50 focus-accent focus:outline-none"
                style={{ borderColor: "var(--c-border)" }}
              />
              <span className="text-sm text-accent-muted font-medium">kcal</span>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
