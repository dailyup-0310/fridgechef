"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Clock, UtensilsCrossed } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface Props {
  recipe: Recipe | null;
  showCalories: boolean;
  onClose: () => void;
}

export function RecipeDetail({ recipe, showCalories, onClose }: Props) {
  return (
    <AnimatePresence>
      {recipe && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[2rem] shadow-clay-lg"
            style={{ backgroundColor: "var(--c-bg)" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 pt-3 pb-3 px-5" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="w-10 h-1 bg-accent-muted rounded-full mx-auto mb-3 opacity-30" />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl text-theme leading-tight pr-8">{recipe.name}</h2>
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-accent-light text-accent transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Image */}
              <div
                className="w-full h-44 rounded-3xl flex items-center justify-center overflow-hidden shadow-clay"
                style={{ background: "linear-gradient(135deg, var(--c-accent-light), var(--c-surface))" }}
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed size={48} className="text-accent-muted opacity-25" />
                )}
              </div>

              {/* Description */}
              {recipe.description && (
                <p className="text-sm text-theme-muted leading-relaxed -mt-1">{recipe.description}</p>
              )}

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {showCalories && recipe.calories != null && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-light text-accent text-sm font-semibold">
                    <Flame size={13} />
                    <span>{recipe.calories} kcal</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-theme-muted text-sm font-medium">
                  <Clock size={13} />
                  <span>~{recipe.cookTimeMinutes} min</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-theme-muted text-sm font-medium">
                  <span>{recipe.difficulty}</span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="font-bold text-theme text-sm mb-2.5">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing) => {
                    const isUserIng = recipe.usedUserIngredients.includes(ing);
                    return (
                      <span
                        key={ing}
                        className={`px-3 py-1 rounded-full text-sm border font-medium shadow-clay-sm ${
                          isUserIng
                            ? "bg-accent-light text-accent border-accent/30"
                            : "bg-white text-theme-muted"
                        }`}
                        style={isUserIng ? {} : { borderColor: "var(--c-border)" }}
                      >
                        {ing}
                      </span>
                    );
                  })}
                </div>
                {recipe.usedUserIngredients.length > 0 && (
                  <p className="text-[11px] text-accent-muted mt-2 opacity-60">
                    Highlighted: your ingredients
                  </p>
                )}
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-bold text-theme text-sm mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 bg-accent text-white rounded-full text-xs flex items-center justify-center font-bold shadow-clay-sm">
                        {i + 1}
                      </span>
                      <p className="text-sm text-theme-muted leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
