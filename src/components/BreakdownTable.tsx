import type { BreakdownRow } from "@/lib/stats";
import { formatPct, formatPf, formatR } from "@/lib/stats";

/**
 * A breakdown table for one analytic dimension. Each row shows winrate,
 * expectancy, total R and trade count, with a horizontal bar visualising
 * total R relative to the strongest/weakest row (the small "graph").
 */
export function BreakdownTable({
  title,
  hint,
  rows,
  highlightKeys,
}: {
  title: string;
  hint?: string;
  rows: BreakdownRow[];
  /** Keys to flag visually (e.g. negative sentiments, hors-plan). */
  highlightKeys?: string[];
}) {
  const maxAbsR = Math.max(1, ...rows.map((r) => Math.abs(r.stats.totalR)));

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {hint && <span className="text-[11px] text-ink-dim">{hint}</span>}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-dim">
          Pas encore de données pour cette dimension.
        </p>
      ) : (
        <div className="divide-y divide-border-soft">
          {/* header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wider text-ink-dim">
            <div className="col-span-4">Segment</div>
            <div className="col-span-2 text-right">N</div>
            <div className="col-span-2 text-right">WR</div>
            <div className="col-span-2 text-right">Esp.</div>
            <div className="col-span-2 text-right">Total R</div>
          </div>

          {rows.map((r) => {
            const s = r.stats;
            const flagged = highlightKeys?.includes(r.key);
            const barW = (Math.abs(s.totalR) / maxAbsR) * 100;
            const pos = s.totalR >= 0;
            return (
              <div key={r.key} className="px-4 py-2.5">
                <div className="grid grid-cols-12 items-center gap-2 text-sm">
                  <div className="col-span-4 flex items-center gap-1.5 truncate">
                    <span className={flagged ? "font-medium text-loss" : "font-medium text-ink"}>
                      {r.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-ink-soft tabular">{s.count}</div>
                  <div className="col-span-2 text-right font-mono text-ink-soft tabular">
                    {s.wins + s.losses > 0 ? formatPct(s.winrate) : "—"}
                  </div>
                  <div
                    className={`col-span-2 text-right font-mono tabular ${
                      s.expectancy > 0 ? "text-win" : s.expectancy < 0 ? "text-loss" : "text-ink-soft"
                    }`}
                  >
                    {formatR(s.expectancy)}
                  </div>
                  <div
                    className={`col-span-2 text-right font-mono font-semibold tabular ${
                      pos ? "text-win" : "text-loss"
                    }`}
                  >
                    {formatR(s.totalR)}
                  </div>
                </div>
                {/* mini bar */}
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg-soft">
                  <div
                    className={pos ? "h-full bg-win/70" : "h-full bg-loss/70"}
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RrComparison({
  avgPlanned,
  avgRealized,
}: {
  avgPlanned: number | null;
  avgRealized: number | null;
}) {
  const planned = avgPlanned ?? 0;
  const realized = avgRealized ?? 0;
  const max = Math.max(1, Math.abs(planned), Math.abs(realized));
  return (
    <div className="panel p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">
        RR planifié moyen vs réalisé moyen
      </h3>
      <div className="space-y-4">
        <Bar label="RR planifié (cible)" value={planned} max={max} color="bg-accent" display={avgPlanned != null ? planned.toFixed(2) : "—"} />
        <Bar
          label="R réalisé"
          value={realized}
          max={max}
          color={realized >= 0 ? "bg-win" : "bg-loss"}
          display={avgRealized != null ? formatR(realized) : "—"}
        />
      </div>
      <p className="mt-4 text-[11px] text-ink-dim">
        Un réalisé bien sous le planifié = sorties anticipées ou full-SL fréquents.
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
  display,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  display: string;
}) {
  const w = (Math.abs(value) / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono font-semibold tabular">{display}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-soft">
        <div className={`h-full ${color}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

export { formatPf };
