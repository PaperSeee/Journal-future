import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "win" | "loss" | "accent";
  hint?: string;
}) {
  const valueColor =
    tone === "win"
      ? "text-win"
      : tone === "loss"
      ? "text-loss"
      : tone === "accent"
      ? "text-accent"
      : "text-ink";
  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5">
      {tone === "accent" && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
      )}
      <div className="label">{label}</div>
      <div className={`stat-value mt-1.5 ${valueColor}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-dim">{sub}</div>}
      {hint && <div className="mt-1 text-[11px] text-ink-dim">{hint}</div>}
    </div>
  );
}
