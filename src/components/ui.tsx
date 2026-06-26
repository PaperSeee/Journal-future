import Link from "next/link";
import type { ReactNode } from "react";
import { formatR } from "@/lib/stats";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ResultBadge({ result }: { result: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    WIN: { cls: "border-win/40 bg-win/15 text-win", label: "Win" },
    LOSS: { cls: "border-loss/40 bg-loss/15 text-loss", label: "Loss" },
    BE: { cls: "border-be/40 bg-be/15 text-ink-soft", label: "BE" },
  };
  const m = map[result] ?? map.BE!;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function RCell({ r }: { r: number | null }) {
  const tone =
    r == null ? "text-ink-dim" : r > 0 ? "text-win" : r < 0 ? "text-loss" : "text-ink-soft";
  return <span className={`font-mono font-semibold tabular ${tone}`}>{formatR(r)}</span>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-dim">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}

export function NewTradeButton() {
  return (
    <Link href="/journal/new" className="btn-primary">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nouveau trade
    </Link>
  );
}
