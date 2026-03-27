"use client";

import * as React from "react";
import { AnimatePresence, m } from "framer-motion";

import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (t: ToastInput) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function randomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: ToastInput) => {
    const id = randomId();
    const item: ToastItem = {
      id,
      title: t.title,
      description: t.description,
      variant: t.variant ?? "info",
    };
    setItems((prev) => [item, ...prev].slice(0, 5));
    const duration = typeof t.durationMs === "number" ? t.durationMs : 3200;
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <m.div
              key={t.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
                t.variant === "success"
                  ? "bg-emerald-50 border-emerald-200"
                  : t.variant === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-[color-mix(in_srgb,var(--card)_92%,transparent)] border-[var(--border)]"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-1 h-2.5 w-2.5 rounded-full",
                    t.variant === "success"
                      ? "bg-emerald-500"
                      : t.variant === "error"
                        ? "bg-red-500"
                        : "bg-sky-500"
                  )}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight">{t.title}</div>
                  {t.description ? (
                    <div className="mt-0.5 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                      {t.description}
                    </div>
                  ) : null}
                </div>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
