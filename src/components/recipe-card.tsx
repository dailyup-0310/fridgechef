"use client";

import { motion } from "framer-motion";
import { Flame, UtensilsCrossed } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface Props {
  recipe: Recipe;
  showCalories: boolean;
  onClick: () => void;
}

const DAILY_GRADIENTS = [
  "from-amber-100 via-orange-50 to-yellow-100",
  "from-orange-100 via-rose-50 to-amber-100",
  "from-yellow-100 via-amber-50 to-orange-100",
];

const DIET_GRADIENTS = [
  "from-green-100 via-teal-50 to-emerald-100",
  "from-emerald-100 via-green-50 to-teal-100",
  "from-teal-100 via-emerald-50 to-green-100",
];

export function RecipeCard({ recipe, showCalories, onClick }: Props) {
  const gradients = showCalories ? DIET_GRADIENTS : DAILY_GRADIENTS;
  const colorIndex = parseInt(recipe.id.replace(/\D/g, ""), 10) % gradients.length;
  const gradient = gradients[colorIndex] ?? gradients[0];

  return (
    <motion.div
      layoutId={`recipe-card-${recipe.id}`}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="cursor-pointer rounded-3xl overflow-hidden bg-white shadow-clay"
    >
      <div className={`w-full aspect-[3/2] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed size={24} className="text-accent-muted opacity-30" />
        )}
      </div>

      <div className="px-3 py-2.5 bg-white space-y-1">
        <h3 className="font-bold text-theme text-xs leading-tight line-clamp-2">{recipe.name}</h3>
        {showCalories && recipe.calories != null && (
          <div className="flex items-center gap-0.5 text-accent text-xs font-semibold">
            <Flame size={11} />
            <span>{recipe.calories}</span>
            <span className="text-[10px] font-normal opacity-70">kcal</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
