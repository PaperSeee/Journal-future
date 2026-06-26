"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["space-y-1.5", className].filter(Boolean).join(" ")}>
      <label className="label flex items-center justify-between" htmlFor={htmlFor}>
        <span>{label}</span>
        {hint && <span className="font-normal normal-case text-ink-dim">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}

export function Select({
  options,
  ...props
}: {
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={["input cursor-pointer", props.className].filter(Boolean).join(" ")}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Segmented pill control for small enum choices (direction, result…). */
export function Segmented({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; tone?: "win" | "loss" | "be" | "accent" }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-border bg-bg-soft p-1">
      <input type="hidden" name={name} value={value} />
      {options.map((o) => {
        const active = o.value === value;
        const tone =
          o.tone === "win"
            ? "data-[active=true]:bg-win/20 data-[active=true]:text-win"
            : o.tone === "loss"
            ? "data-[active=true]:bg-loss/20 data-[active=true]:text-loss"
            : o.tone === "be"
            ? "data-[active=true]:bg-be/20 data-[active=true]:text-ink"
            : "data-[active=true]:bg-accent/20 data-[active=true]:text-accent";
        return (
          <button
            key={o.value}
            type="button"
            data-active={active}
            onClick={() => onChange(o.value)}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition",
              "hover:text-ink",
              tone,
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  name,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-bg-soft px-3 py-2.5">
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {description && <div className="text-xs text-ink-dim">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-accent" : "bg-border",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
            checked ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
