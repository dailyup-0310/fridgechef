"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

export function InviteGate({ onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error ?? "邀请码无效");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{ backgroundColor: "var(--c-bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Icon + title */}
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-clay"
            style={{ backgroundColor: "var(--c-accent-light)" }}
          >
            <KeyRound size={24} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme">FridgeChef</h1>
            <p className="text-sm text-theme-muted mt-1">请输入邀请码以继续使用</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            placeholder="输入邀请码"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-12 px-4 text-base font-mono tracking-widest border rounded-2xl bg-white shadow-clay-sm text-theme placeholder:text-accent-muted placeholder:opacity-40 placeholder:font-sans placeholder:tracking-normal focus:outline-none text-center uppercase"
            style={{ borderColor: error ? "#ef4444" : "var(--c-border)" }}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-500 text-center font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={!code.trim() || loading}
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-clay-btn disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: "var(--c-accent)" }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>进入</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-xs text-theme-muted opacity-50">
          没有邀请码？请联系管理员获取
        </p>
      </motion.div>
    </motion.div>
  );
}
