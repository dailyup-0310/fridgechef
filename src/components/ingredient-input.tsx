"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, ShoppingBasket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IngredientItem } from "@/types/ingredient";
import { INGREDIENT_TAG_GROUPS } from "@/features/ingredient/ingredient-tags";

interface Props {
  ingredients: IngredientItem[];
  onChange: (ingredients: IngredientItem[]) => void;
}

const MAX_INGREDIENTS = 15;

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

export function IngredientInput({ ingredients, onChange }: Props) {
  const filledCount = ingredients.filter((i) => i.input.trim()).length;
  const canAdd = ingredients.length < MAX_INGREDIENTS;

  function handleChange(id: string, value: string) {
    onChange(ingredients.map((i) => (i.id === id ? { ...i, input: value, normalized: value } : i)));
  }

  function handleRemove(id: string) {
    if (ingredients.length <= 1) return;
    onChange(ingredients.filter((i) => i.id !== id));
  }

  function handleAdd() {
    if (!canAdd) return;
    onChange([...ingredients, { id: makeId(), input: "", normalized: "" }]);
  }

  function handleTagClick(tag: string) {
    const existingIdx = ingredients.findIndex((i) => i.input === tag);
    if (existingIdx !== -1) {
      // deselect: clear that slot
      onChange(
        ingredients.map((item, i) =>
          i === existingIdx ? { ...item, input: "", normalized: "" } : item
        )
      );
      return;
    }
    const emptySlot = ingredients.find((i) => !i.input.trim());
    if (emptySlot) {
      onChange(ingredients.map((i) => (i.id === emptySlot.id ? { ...i, input: tag, normalized: tag } : i)));
    } else if (canAdd) {
      onChange([...ingredients, { id: makeId(), input: tag, normalized: tag }]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-theme flex items-center gap-2">
          <ShoppingBasket size={17} className="text-accent" />
          My Ingredients
        </h2>
        {filledCount > 0 && filledCount < 3 && (
          <span className="text-xs text-accent-muted font-medium">More ingredients, more recipes</span>
        )}
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {ingredients.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs font-bold text-accent-muted w-5 text-right shrink-0 tabular-nums opacity-60">
                {index + 1}
              </span>
              <Input
                value={item.input}
                onChange={(e) => handleChange(item.id, e.target.value)}
                placeholder="Enter ingredient, e.g. eggs, tomatoes"
                className="flex-1 bg-white border-theme focus-accent rounded-2xl h-11 text-sm shadow-clay-sm placeholder:text-accent-muted placeholder:opacity-50 text-theme"
                style={{ borderColor: "var(--c-border)" }}
              />
              <motion.button
                onClick={() => handleRemove(item.id)}
                disabled={ingredients.length <= 1}
                whileTap={{ scale: 0.88 }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-accent-muted hover:text-accent hover:bg-accent-light disabled:opacity-20 transition-colors cursor-pointer"
              >
                <X size={14} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {canAdd && (
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-accent-muted hover:text-accent border border-dashed border-accent-muted hover:border-accent rounded-2xl h-10 transition-colors cursor-pointer bg-white/60"
          style={{ borderColor: "var(--c-accent-muted)", opacity: 0.7 }}
        >
          <Plus size={15} />
          <span>Add Ingredient</span>
        </motion.button>
      )}

      <div className="space-y-2.5 pt-1">
        <p className="text-[11px] text-theme-muted font-medium">
          Suggested ingredients (click to select, click again to remove)
        </p>
        {INGREDIENT_TAG_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-theme-muted shrink-0">{group.label}</span>
            {group.tags.map((tag) => {
              const selected = ingredients.some((i) => i.input === tag);
              return (
                <motion.button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  whileTap={{ scale: 0.92 }}
                  className={`cursor-pointer text-xs px-3 py-1 rounded-full border font-medium transition-all duration-200 ${
                    selected
                      ? "bg-accent border-accent text-white shadow-clay-sm"
                      : "bg-white border-theme text-accent-muted hover:border-accent hover:text-accent"
                  }`}
                  style={selected ? {} : { borderColor: "var(--c-border)" }}
                >
                  {tag}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
