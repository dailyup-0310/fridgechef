"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  loading: boolean;
  disabled: boolean;
  hasResults: boolean;
  onClick: () => void;
}

export function GenerateBar({ loading, disabled, hasResults, onClick }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 pt-8 pb-6 px-4"
      style={{ background: "linear-gradient(to top, var(--c-bg) 55%, transparent)" }}
    >
      <div className="max-w-xl mx-auto">
        <motion.button
          onClick={onClick}
          disabled={disabled || loading}
          whileTap={disabled || loading ? {} : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`w-full h-14 rounded-[1.6rem] font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
            disabled || loading
              ? "bg-accent-light text-accent-muted cursor-not-allowed"
              : "bg-accent text-white shadow-clay-btn hover:bg-accent-dark active:translate-y-0.5"
          }`}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
              />
              <span>Chef is cooking...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{hasResults ? "Get New Recipes" : "Cook for Me"}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
