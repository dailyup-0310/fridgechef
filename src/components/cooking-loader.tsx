"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Prepping ingredients...",
  "Exploring ingredient combos...",
  "Chef inspiration striking...",
  "Mastering the heat...",
  "Recipe almost ready...",
];

export function CookingLoader() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      {/* Animated pot */}
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Steam lines */}
          <motion.path
            d="M22 14 Q20 10 22 6 Q24 2 22 -2"
            stroke="var(--c-accent-muted)" strokeWidth="1.8" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -3, -1] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
          />
          <motion.path
            d="M32 12 Q30 8 32 4 Q34 0 32 -4"
            stroke="var(--c-accent-muted)" strokeWidth="1.8" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -3, -1] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
          />
          <motion.path
            d="M42 14 Q40 10 42 6 Q44 2 42 -2"
            stroke="var(--c-accent-muted)" strokeWidth="1.8" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -3, -1] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.6 }}
          />
          {/* Lid */}
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}
          >
            <path d="M18 26 Q32 20 46 26" stroke="var(--c-accent)" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32" cy="21" r="3" stroke="var(--c-accent)" strokeWidth="2" />
          </motion.g>
          {/* Pot body */}
          <path d="M16 28 Q14 44 16 50 Q18 56 32 56 Q46 56 48 50 Q50 44 48 28 Z"
            stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Handles */}
          <path d="M16 34 Q8 34 8 40 Q8 46 16 46" stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round" />
          <path d="M48 34 Q56 34 56 40 Q56 46 48 46" stroke="var(--c-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Cycling message */}
      <div className="h-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-accent-muted"
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent-muted"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
