"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHECKLIST } from "@/lib/plan";

const STORAGE_KEY = "hqgambler:checklist";

export function PreTradeChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Restore the in-session checklist state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, hydrated]);

  const done = useMemo(
    () => CHECKLIST.filter((c) => checked[c.id]).length,
    [checked],
  );
  const total = CHECKLIST.length;
  const allDone = done === total;
  const pct = (done / total) * 100;

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function reset() {
    setChecked({});
  }

  return (
    <div className="panel overflow-hidden">
      {/* Progress header */}
      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Checklist pré-trade</h2>
          <span className="font-mono text-sm text-ink-soft tabular">
            {done}/{total}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-soft">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              allDone ? "bg-win" : "bg-accent"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Validated banner */}
      {allDone && (
        <div className="flex items-center gap-3 border-b border-win/30 bg-win/10 px-5 py-3.5 text-win animate-fade-in">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="font-display font-semibold tracking-wide">SETUP VALIDÉ</div>
            <div className="text-xs text-win/80">Les 8 points sont cochés — tu peux exécuter.</div>
          </div>
          <Link href="/journal/new" className="btn-primary !bg-win !text-bg shrink-0">
            Logger le trade
          </Link>
        </div>
      )}

      {/* Items */}
      <ul className="divide-y divide-border-soft">
        {CHECKLIST.map((item, i) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-panel-hover/40"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    isChecked
                      ? "border-accent bg-accent text-bg"
                      : "border-border bg-bg-soft text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-ink-dim">{i + 1}.</span>
                    <span
                      className={`font-medium transition ${
                        isChecked ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-dim">{item.detail}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-xs text-ink-dim">
          {allDone ? "Tout est coché." : `${total - done} point(s) restant(s).`}
        </span>
        <button onClick={reset} className="text-xs font-medium text-ink-soft hover:text-loss">
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}
