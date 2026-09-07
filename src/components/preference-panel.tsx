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
  { value: "breakfast", label: "Breakfast" },
  { value: "main", label: "Main Meal" },
];


const CUISINE_OPTIONS = [
  { value: "Chinese", label: "Chinese" },
  { value: "Western", label: "Western" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
];

const FLAVOR_OPTIONS = [
  { value: "Mild", label: "Mild" },
  { value: "Medium", label: "Medium" },
  { value: "Bold", label: "Bold" },
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
        Preferences
        <span className="font-normal text-accent-muted text-sm opacity-70">(optional)</span>
      </h2>

      <div className="space-y-4">
        <ChipGroup label="Meal Type" options={MEAL_TYPE_OPTIONS} value={prefs.mealType} onSelect={(v) => patch("mealType", v)} />
        {/* Cook time slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Cook Time</span>
            <span className="text-xs font-bold text-theme">
              {prefs.cookTime ? `${prefs.cookTime} min` : "—"}
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
            <span>1 hr</span>
            <span>2 hr</span>
            <span>3 hr</span>
          </div>
        </div>

        {mode === "daily" && (
          <>
            <ChipGroup label="Cuisine" options={CUISINE_OPTIONS} value={prefs.cuisine} onSelect={(v) => patch("cuisine", v)} />
            <ChipGroup label="Flavor" options={FLAVOR_OPTIONS} value={prefs.flavor} onSelect={(v) => patch("flavor", v)} />
          </>
        )}

        {mode === "diet" && (
          <>
          <ChipGroup label="Cuisine" options={CUISINE_OPTIONS} value={prefs.cuisine} onSelect={(v) => patch("cuisine", v)} />
          <div className="space-y-2">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wide">Calorie Target</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={2000}
                placeholder="e.g. 500"
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
