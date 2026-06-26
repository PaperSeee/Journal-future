"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  INSTRUMENTS,
  LABELS,
  POI_SIZES,
  POI_TYPES,
  REACTIONS,
  RESULTS,
  SENTIMENTS,
  SESSIONS,
} from "@/lib/domain";

const FILTER_KEYS = [
  "instrument",
  "session",
  "poiSize",
  "poiType",
  "reaction",
  "sentiment",
  "result",
  "followedPlan",
  "from",
  "to",
  "tag",
] as const;

function buildOptions<T extends string>(
  placeholder: string,
  arr: readonly T[],
  labels: Record<T, string>,
) {
  return [
    { value: "", label: placeholder },
    ...arr.map((v) => ({ value: v, label: labels[v] })),
  ];
}

export function Filters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = (k: string) => params.get(k) ?? "";
  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function reset() {
    router.replace(pathname, { scroll: false });
  }

  const Sel = ({
    k,
    options,
  }: {
    k: string;
    options: { value: string; label: string }[];
  }) => (
    <select
      className="input cursor-pointer"
      value={current(k)}
      onChange={(e) => update(k, e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="panel mb-5 p-3 sm:p-4">
      <button
        className="flex w-full items-center justify-between gap-2 sm:hidden"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <FilterIcon className="h-4 w-4 text-accent" />
          Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronIcon className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`${open ? "mt-4 block" : "hidden"} sm:block`}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Sel k="instrument" options={buildOptions("Instrument", INSTRUMENTS, LABELS.instrument)} />
          <Sel k="session" options={buildOptions("Session", SESSIONS, LABELS.session)} />
          <Sel k="poiType" options={buildOptions("Type POI", POI_TYPES, LABELS.poiType)} />
          <Sel k="poiSize" options={buildOptions("Taille POI", POI_SIZES, LABELS.poiSize)} />
          <Sel k="reaction" options={buildOptions("Réaction", REACTIONS, LABELS.reaction)} />
          <Sel k="sentiment" options={buildOptions("Sentiment", SENTIMENTS, LABELS.sentiment)} />
          <Sel k="result" options={buildOptions("Résultat", RESULTS, LABELS.result)} />
          <Sel
            k="followedPlan"
            options={[
              { value: "", label: "Plan" },
              { value: "true", label: "Plan respecté" },
              { value: "false", label: "Plan non respecté" },
            ]}
          />
          {tags.length > 0 && (
            <Sel
              k="tag"
              options={[{ value: "", label: "Tag" }, ...tags.map((t) => ({ value: t, label: t }))]}
            />
          )}
          <input
            type="date"
            className="input"
            value={current("from")}
            onChange={(e) => update("from", e.target.value)}
            aria-label="Du"
          />
          <input
            type="date"
            className="input"
            value={current("to")}
            onChange={(e) => update("to", e.target.value)}
            aria-label="Au"
          />
        </div>
        {activeCount > 0 && (
          <button onClick={reset} className="mt-3 text-xs text-accent hover:underline">
            Réinitialiser les filtres ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
