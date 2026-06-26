"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{
  push: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = (message: string, kind: ToastKind = "success") => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur",
              t.kind === "success" &&
                "border-win/40 bg-win/15 text-win",
              t.kind === "error" && "border-loss/40 bg-loss/15 text-loss",
              t.kind === "info" && "border-accent/40 bg-accent/10 text-accent",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
