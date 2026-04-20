"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModeSwitch } from "@/components/mode-switch";
import { IngredientInput } from "@/components/ingredient-input";
import { PreferencePanel } from "@/components/preference-panel";
import { GenerateBar } from "@/components/generate-bar";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDetail } from "@/components/recipe-detail";
import { CookingLoader } from "@/components/cooking-loader";
import { InviteGate } from "@/components/invite-gate";
import { Mode, DailyPreferences, DietPreferences } from "@/types/preference";
import { IngredientItem } from "@/types/ingredient";
import { Recipe } from "@/types/recipe";
import { extractIngredientNames } from "@/lib/prompt";
import type { GenerateRequest, GenerateResponse } from "@/types/api";

const MOCK_RECIPES_DAILY: Recipe[] = [
  {
    id: "r1",
    name: "番茄炒鸡蛋",
    description: "家常经典，酸甜下饭",
    ingredients: ["西红柿", "鸡蛋", "盐", "油", "葱"],
    usedUserIngredients: ["西红柿", "鸡蛋"],
    steps: [
      "鸡蛋打散，加少许盐搅匀备用。",
      "西红柿切块，葱切末。",
      "热锅冷油，炒熟鸡蛋盛出。",
      "同锅下西红柿翻炒出汁，倒入鸡蛋，调味翻匀即可。",
    ],
    cookTimeMinutes: 15,
    difficulty: "简单",
    imageUrl: "",
  },
  {
    id: "r2",
    name: "蒜蓉西兰花",
    description: "清爽脆嫩，蒜香浓郁",
    ingredients: ["西兰花", "大蒜", "盐", "油", "生抽"],
    usedUserIngredients: ["西兰花"],
    steps: [
      "西兰花掰成小朵，洗净焯水 1 分钟捞出。",
      "大蒜切末，热油爆香。",
      "下西兰花大火翻炒，加盐和生抽调味即可。",
    ],
    cookTimeMinutes: 10,
    difficulty: "简单",
    imageUrl: "",
  },
  {
    id: "r3",
    name: "葱油拌面",
    description: "葱香四溢，一拌即食",
    ingredients: ["面条", "葱", "生抽", "老抽", "糖", "油"],
    usedUserIngredients: ["面条", "葱"],
    steps: [
      "葱切段，热油小火慢炸至金黄捞出，留葱油。",
      "生抽、老抽、糖调成酱汁，倒入葱油锅中略煮。",
      "面条煮熟，淋上酱汁拌匀，摆上炸葱即可。",
    ],
    cookTimeMinutes: 20,
    difficulty: "简单",
    imageUrl: "",
  },
];

const MOCK_RECIPES_DIET: Recipe[] = [
  {
    id: "d1",
    name: "水煮鸡胸肉沙拉",
    description: "高蛋白低脂，饱腹感强",
    ingredients: ["鸡胸肉", "黄瓜", "胡萝卜", "生菜", "柠檬汁", "盐"],
    usedUserIngredients: ["鸡胸肉"],
    steps: [
      "鸡胸肉煮熟，放凉后撕成细条。",
      "黄瓜、胡萝卜切丝，生菜撕碎。",
      "全部混合，挤柠檬汁，撒盐拌匀即可。",
    ],
    cookTimeMinutes: 20,
    difficulty: "简单",
    calories: 320,
    imageUrl: "",
  },
  {
    id: "d2",
    name: "蒸蛋豆腐",
    description: "嫩滑低卡，补钙补蛋白",
    ingredients: ["鸡蛋", "豆腐", "生抽", "葱花", "香油"],
    usedUserIngredients: ["鸡蛋", "豆腐"],
    steps: [
      "豆腐切块铺底，鸡蛋打散加温水 1:1.5 比例搅匀。",
      "蛋液过筛倒入豆腐碗，蒸 10 分钟至凝固。",
      "淋生抽和几滴香油，撒葱花即可。",
    ],
    cookTimeMinutes: 15,
    difficulty: "简单",
    calories: 210,
    imageUrl: "",
  },
  {
    id: "d3",
    name: "清炒时蔬",
    description: "多彩蔬菜，低热量高纤维",
    ingredients: ["西兰花", "胡萝卜", "菠菜", "蒜", "盐", "油"],
    usedUserIngredients: ["西兰花", "胡萝卜"],
    steps: [
      "所有蔬菜洗净切好，蒜切片。",
      "热锅少油，爆香蒜片，下蔬菜大火翻炒。",
      "加盐调味，炒至断生即可出锅。",
    ],
    cookTimeMinutes: 10,
    difficulty: "简单",
    calories: 180,
    imageUrl: "",
  },
];

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

function defaultIngredients(): IngredientItem[] {
  return [
    { id: makeId(), input: "", normalized: "" },
    { id: makeId(), input: "", normalized: "" },
    { id: makeId(), input: "", normalized: "" },
  ];
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("daily");
  const [ingredients, setIngredients] = useState<IngredientItem[]>(defaultIngredients);
  const [preferences, setPreferences] = useState<DailyPreferences | DietPreferences>({});
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shownNames, setShownNames] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noMoreRecipes, setNoMoreRecipes] = useState(false);
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([]);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check auth cookie on mount
  useEffect(() => {
    const val = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("fridge_auth="))?.split("=")[1];
    const has = !!val && val !== "1";
    setAuthed(has);
  }, []);

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (!errorMsg) return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 5000);
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, [errorMsg]);

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setIngredients(defaultIngredients());
    setPreferences({});
    setRecipes([]);
    setShownNames([]);
    setErrorMsg(null);
    setNoMoreRecipes(false);
    setSuggestedIngredients([]);
  }

  function handleReset() {
    setIngredients(defaultIngredients());
    setPreferences({});
    setRecipes([]);
    setShownNames([]);
    setErrorMsg(null);
    setNoMoreRecipes(false);
    setSuggestedIngredients([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleGenerate() {
    setLoading(true);
    setRecipes([]);
    setErrorMsg(null);
    setNoMoreRecipes(false);
    setSuggestedIngredients([]);

    const body: GenerateRequest = {
      mode,
      ingredients: extractIngredientNames(ingredients),
      preferences,
      excludeNames: shownNames.length > 0 ? shownNames : undefined,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: GenerateResponse = await res.json();
      if (data.success) {
        if (data.noMoreRecipes) {
          setNoMoreRecipes(true);
        } else if (data.noRecipePossible) {
          setSuggestedIngredients(data.suggestedIngredients ?? []);
        } else {
          setRecipes(data.recipes);
          setShownNames((prev) => [...prev, ...data.recipes.map((r) => r.name)]);
        }
      } else {
        setErrorMsg(data.error ?? "生成失败，请重试");
      }
    } catch {
      setErrorMsg("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  const hasIngredients = ingredients.some((i) => i.input.trim());
  const isDiet = mode === "diet";

  // Still checking cookie
  if (authed === null) return null;

  // Not authenticated — show invite gate
  if (!authed) {
    return (
      <main data-mode="daily">
        <InviteGate onSuccess={() => setAuthed(true)} />
      </main>
    );
  }

  return (
    <main data-mode={mode} className="min-h-screen bg-theme pb-28 transition-colors duration-500">

      {/* ── Full-page food illustration background ── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* All strokes use CSS var so color changes with mode */}

        {/* ── Large citrus cross-section — bottom center (主角) ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.28 }} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="195" cy="826" r="76" />
          <circle cx="195" cy="826" r="58" />
          <circle cx="195" cy="826" r="10" />
          {/* 8 segment lines from center */}
          <line x1="195" y1="826" x2="195" y2="768" />
          <line x1="195" y1="826" x2="236" y2="785" />
          <line x1="195" y1="826" x2="253" y2="826" />
          <line x1="195" y1="826" x2="236" y2="867" />
          <line x1="195" y1="826" x2="195" y2="884" />
          <line x1="195" y1="826" x2="154" y2="867" />
          <line x1="195" y1="826" x2="137" y2="826" />
          <line x1="195" y1="826" x2="154" y2="785" />
          {/* Juice sac dots in segments */}
          <circle cx="195" cy="793" r="3" />
          <circle cx="220" cy="800" r="3" />
          <circle cx="228" cy="826" r="3" />
          <circle cx="218" cy="852" r="3" />
          <circle cx="170" cy="800" r="3" />
          <circle cx="162" cy="826" r="3" />
        </g>

        {/* ── Ladle / 汤勺 — upper right ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Bowl of spoon */}
          <path d="M 318 68 Q 302 72 296 88 Q 292 104 300 116 Q 310 126 326 124 Q 342 120 348 104 Q 352 88 344 76 Q 336 66 318 68 Z" />
          {/* Handle — long diagonal */}
          <path d="M 338 118 Q 352 140 368 178 Q 376 202 372 214" />
          {/* Handle end curl */}
          <path d="M 372 214 Q 378 224 372 230 Q 364 232 360 224" />
        </g>

        {/* ── Apple 苹果 — upper left ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 46 90 Q 22 86 18 68 Q 16 50 28 42 Q 40 36 48 46 Q 56 36 68 42 Q 80 50 78 68 Q 74 86 50 90 Z" />
          <line x1="48" y1="44" x2="46" y2="28" />
          <path d="M 46 34 Q 56 24 64 32 Q 58 42 48 38 Z" />
        </g>

        {/* ── Tomato 西红柿 — upper right area ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="330" cy="140" r="26" />
          {/* Calyx leaves */}
          <path d="M 318 114 Q 312 104 316 96 Q 322 104 320 114" />
          <path d="M 330 112 Q 328 100 330 92 Q 332 100 332 112" />
          <path d="M 342 114 Q 346 104 344 96 Q 338 104 340 114" />
          <path d="M 316 114 Q 330 110 344 114" />
          {/* Inner line */}
          <path d="M 304 140 Q 318 132 330 136 Q 342 140 356 132" strokeWidth="0.9" />
        </g>

        {/* ── Egg 鸡蛋 (fried) — left mid ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* White blob */}
          <path d="M 6 296 Q -4 310 2 328 Q 8 344 26 350 Q 46 356 60 342 Q 72 328 68 310 Q 62 294 44 288 Q 24 284 6 296 Z" />
          {/* Yolk */}
          <circle cx="38" cy="320" r="13" />
        </g>

        {/* ── Carrot 胡萝卜 — right side ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Body */}
          <path d="M 358 258 Q 350 278 348 302 Q 347 318 354 324 Q 360 320 366 306 Q 372 284 370 262 Q 368 252 358 258 Z" />
          {/* Ridge lines */}
          <line x1="349" y1="280" x2="368" y2="278" />
          <line x1="348" y1="300" x2="366" y2="298" />
          {/* Leafy top */}
          <path d="M 358 258 Q 350 240 342 234" />
          <path d="M 360 256 Q 358 236 358 226" />
          <path d="M 362 258 Q 370 240 378 236" />
        </g>

        {/* ── Mushroom 蘑菇 — left lower ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Cap */}
          <path d="M 18 488 Q 16 464 28 450 Q 42 438 58 442 Q 74 446 80 462 Q 84 478 78 490 Z" />
          {/* Gills line */}
          <path d="M 18 488 Q 42 500 60 500 Q 78 500 78 490" />
          {/* Stem */}
          <path d="M 34 500 Q 32 522 36 530 Q 46 536 66 530 Q 72 520 68 500" />
          {/* Spots */}
          <circle cx="36" cy="454" r="5" />
          <circle cx="56" cy="446" r="4.5" />
          <circle cx="70" cy="462" r="3.5" />
        </g>

        {/* ── Strawberry 草莓 — right lower ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Body */}
          <path d="M 330 570 Q 316 576 312 596 Q 310 616 322 630 Q 336 642 350 636 Q 364 628 366 608 Q 368 588 354 572 Q 346 564 330 570 Z" />
          {/* Crown leaves */}
          <path d="M 330 570 Q 324 556 320 548" />
          <path d="M 340 566 Q 338 552 340 542" />
          <path d="M 350 568 Q 356 554 360 548" />
          {/* Seeds */}
          <circle cx="328" cy="592" r="2" />
          <circle cx="342" cy="604" r="2" />
          <circle cx="354" cy="590" r="2" />
          <circle cx="332" cy="616" r="2" />
          <circle cx="350" cy="622" r="2" />
        </g>

        {/* ── Cherry 樱桃 — top center ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="176" cy="54" r="12" />
          <circle cx="202" cy="58" r="12" />
          <path d="M 176 42 Q 180 22 198 20 Q 212 20 202 46" />
          <path d="M 188 32 Q 194 22 202 46" />
        </g>

        {/* ── Broccoli 西兰花 — lower left ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.26 }} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Florets */}
          <path d="M 46 650 Q 32 644 28 630 Q 26 616 38 610 Q 50 606 56 618" />
          <path d="M 56 618 Q 58 602 70 598 Q 82 596 84 610 Q 86 624 74 632" />
          <path d="M 46 650 Q 42 664 54 672 Q 68 678 78 668 Q 86 656 82 638 Q 78 630 74 632" />
          {/* Stem */}
          <line x1="60" y1="670" x2="58" y2="700" />
          <line x1="70" y1="668" x2="72" y2="700" />
          <path d="M 52 700 Q 64 708 78 702" />
        </g>

        {/* ── Fish 鱼 — center lower ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.24 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Body */}
          <path d="M 148 718 Q 160 702 186 700 Q 214 700 228 718 Q 214 736 188 738 Q 162 736 148 718 Z" />
          {/* Tail */}
          <path d="M 148 718 Q 130 706 124 718 Q 130 730 148 718 Z" />
          {/* Eye */}
          <circle cx="214" cy="714" r="4" />
          {/* Top fin */}
          <path d="M 184 700 Q 186 686 196 690 Q 198 700 192 706" />
          {/* Scale arcs */}
          <path d="M 168 714 Q 174 708 182 714" />
          <path d="M 182 714 Q 188 708 196 714" />
          <path d="M 196 714 Q 202 708 210 714" />
        </g>

        {/* ── Garlic 大蒜 — right mid ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.24 }} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 356 430 Q 338 422 334 406 Q 330 388 342 380 Q 356 374 368 382 Q 382 392 378 410 Q 374 426 358 432 Z" />
          <path d="M 346 430 Q 342 412 346 386" strokeWidth="0.9" />
          <path d="M 358 432 Q 362 412 358 386" strokeWidth="0.9" />
          <path d="M 354 378 Q 352 362 354 350" />
          <path d="M 354 358 Q 362 350 366 358" />
        </g>

        {/* ── Fried egg 煎鸡蛋 — lower left ── */}
        <g style={{ stroke: "var(--c-accent-muted)", fill: "none", opacity: 0.28 }} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          {/* Egg white — wavy blob */}
          <path d="M 40 118 Q 54 112 66 122 Q 76 130 74 146 Q 82 156 74 168 Q 66 180 54 182 Q 46 192 34 188 Q 20 186 12 174 Q 2 162 8 148 Q 6 134 16 126 Q 26 116 40 118 Z" />
          {/* Yolk — circle */}
          <circle cx="42" cy="152" r="16" />
        </g>

        {/* ── Small decorative dots ── */}
        {([
          [112, 36], [258, 20], [80, 185], [310, 310], [160, 410],
          [86, 380], [270, 480], [130, 548], [310, 670], [54, 780],
        ] as [number, number][]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.8"
            style={{ fill: "var(--c-accent-muted)", opacity: 0.18 }} />
        ))}

        {/* ── Small 4-point stars ── */}
        {([
          [240, 100], [340, 380], [80, 640],
        ] as [number, number][]).map(([cx, cy], i) => (
          <g key={i} style={{ stroke: "var(--c-accent-muted)", opacity: 0.20 }} strokeWidth="1.2" strokeLinecap="round">
            <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} />
            <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} />
            <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} />
            <line x1={cx - 4} y1={cy + 4} x2={cx + 4} y2={cy - 4} />
          </g>
        ))}
      </svg>

      {/* ── Hero — bold display type ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 280, backgroundColor: "transparent", zIndex: 1 }}>

        {/* Text */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-14 pb-16">
          <motion.p
            key={`label-${mode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] tracking-[0.24em] uppercase font-medium text-accent-muted mb-3"
          >
            {isDiet ? "减脂饮食助手" : "AI 菜谱生成器"}
          </motion.p>

          <motion.h1
            key={`title-${mode}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 28 }}
            className="text-display-3d text-[3rem] leading-[1.05] text-theme"
          >
            FridgeChef
          </motion.h1>

          <motion.p
            key={`sub-${mode}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-3 text-sm font-medium text-theme-muted max-w-[220px] leading-relaxed"
          >
            {isDiet ? "低卡饮食，从今天开始" : "把冰箱里的食材，变成一顿好饭"}
          </motion.p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--c-bg))" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-xl mx-auto px-4 pt-6 space-y-6" style={{ zIndex: 1 }}>

        {/* Mode Switch */}
        <ModeSwitch mode={mode} onChange={handleModeChange} />

        <div className="h-px border-theme" style={{ borderTopWidth: 1, borderTopColor: "var(--c-border)" }} />

        <IngredientInput ingredients={ingredients} onChange={setIngredients} />

        <div className="h-px" style={{ borderTopWidth: 1, borderTopColor: "var(--c-border)" }} />

        <PreferencePanel mode={mode} preferences={preferences} onChange={setPreferences} />

        {/* Recipe Results */}
        <AnimatePresence>
          {(recipes.length > 0 || loading || noMoreRecipes || suggestedIngredients.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="h-px" style={{ borderTopWidth: 1, borderTopColor: "var(--c-border)" }} />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-theme flex items-center gap-1.5">
                  为你推荐
                </h2>
                {(recipes.length > 0 || noMoreRecipes) && !loading && (
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={handleReset}
                      whileTap={{ scale: 0.92 }}
                      className="text-xs font-medium text-accent-muted hover:text-theme transition-colors cursor-pointer"
                    >
                      重新开始
                    </motion.button>
                    {recipes.length > 0 && (
                      <motion.button
                        onClick={handleGenerate}
                        whileTap={{ scale: 0.92 }}
                        className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors cursor-pointer"
                      >
                        再来一次
                      </motion.button>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <CookingLoader />
              ) : noMoreRecipes ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 flex flex-col items-center gap-3 text-center"
                >
                  <span className="text-3xl">🎉</span>
                  <p className="font-bold text-theme text-base">已经是所有菜谱啦</p>
                  <p className="text-sm text-theme-muted">当前食材能做的菜都推荐过了，换个食材试试？</p>
                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 px-5 py-2 rounded-full text-sm font-semibold text-white shadow-clay-sm cursor-pointer"
                    style={{ backgroundColor: "var(--c-accent)" }}
                  >
                    重新开始
                  </motion.button>
                </motion.div>
              ) : suggestedIngredients.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center gap-4 text-center"
                >
                  <span className="text-3xl">🥗</span>
                  <div>
                    <p className="font-bold text-theme text-base mb-1">食材还不够哦</p>
                    <p className="text-sm text-theme-muted">当前食材暂时搭配不出菜谱，建议添加：</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-3 py-1.5 rounded-full text-sm font-medium border"
                        style={{ backgroundColor: "var(--c-accent-light)", color: "var(--c-accent)", borderColor: "var(--c-accent)" }}
                      >
                        + {ing}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      showCalories={isDiet}
                      onClick={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-28 left-4 right-4 z-30 max-w-xl mx-auto"
          >
            <div
              className="bg-white border rounded-2xl px-4 py-3 shadow-clay flex items-start gap-3"
              style={{ borderColor: "var(--c-border)" }}
            >
              <span className="text-red-500 mt-0.5 shrink-0">✕</span>
              <p className="text-sm text-theme font-medium flex-1">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-accent-muted hover:text-theme transition-colors text-xs shrink-0 mt-0.5 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GenerateBar loading={loading} disabled={!hasIngredients} hasResults={recipes.length > 0} onClick={handleGenerate} />

      <RecipeDetail
        recipe={selectedRecipe}
        showCalories={isDiet}
        onClose={() => setSelectedRecipe(null)}
      />
    </main>
  );
}
