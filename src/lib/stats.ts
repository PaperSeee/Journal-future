// Stats engine — the single source of truth for all metrics & breakdowns.
// `rRealized` (signed R) is the source of truth for performance.

import {
  DAY_LABELS_FR,
  type Reaction,
  type Result,
  type Session,
  type Sentiment,
} from "./domain";

export interface TradeLike {
  id: string;
  date: Date | string;
  instrument: string;
  direction: string;
  session: Session | null;
  entryPoiType: string;
  poiSize: string;
  reactionQuality: Reaction | string;
  noWick: boolean;
  sentimentPre: Sentiment | string | null;
  followedPlan: boolean;
  result: Result | string;
  rRealized: number | null;
  rrPlanned: number | null;
  tapTimeUtc: string | null;
}

export interface CoreStats {
  count: number;
  wins: number;
  losses: number;
  breakevens: number;
  /** Winrate excluding BE: wins / (wins + losses). 0..1 */
  winrate: number;
  /** Expectancy = mean signed R per trade (all trades counted). */
  expectancy: number;
  /** Sum of signed R. */
  totalR: number;
  /** Profit factor = gross win R / gross loss R. Infinity if no losses. */
  profitFactor: number;
  /** Max drawdown in R from the running equity peak (>= 0). */
  maxDrawdown: number;
  /** Mean planned RR over trades that have one. */
  avgRrPlanned: number | null;
  /** Mean realized R over trades that have one (signed). */
  avgRrRealized: number | null;
}

function r(t: TradeLike): number {
  return t.rRealized ?? 0;
}

export function computeStats(trades: TradeLike[]): CoreStats {
  const count = trades.length;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalR = 0;
  let grossWin = 0;
  let grossLoss = 0; // positive magnitude
  let rrPlannedSum = 0;
  let rrPlannedN = 0;
  let rrRealizedSum = 0;
  let rrRealizedN = 0;

  for (const t of trades) {
    const res = t.result;
    if (res === "WIN") wins++;
    else if (res === "LOSS") losses++;
    else if (res === "BE") breakevens++;

    const rr = r(t);
    totalR += rr;
    if (rr > 0) grossWin += rr;
    else if (rr < 0) grossLoss += -rr;

    if (t.rrPlanned != null) {
      rrPlannedSum += t.rrPlanned;
      rrPlannedN++;
    }
    if (t.rRealized != null) {
      rrRealizedSum += t.rRealized;
      rrRealizedN++;
    }
  }

  const decided = wins + losses;
  const winrate = decided > 0 ? wins / decided : 0;
  const expectancy = count > 0 ? totalR / count : 0;
  const profitFactor =
    grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  return {
    count,
    wins,
    losses,
    breakevens,
    winrate,
    expectancy,
    totalR: round2(totalR),
    profitFactor: profitFactor === Infinity ? Infinity : round2(profitFactor),
    maxDrawdown: round2(maxDrawdownR(trades)),
    avgRrPlanned: rrPlannedN > 0 ? round2(rrPlannedSum / rrPlannedN) : null,
    avgRrRealized: rrRealizedN > 0 ? round2(rrRealizedSum / rrRealizedN) : null,
  };
}

/** Cumulative-R equity points in chronological order, with running drawdown. */
export interface EquityPoint {
  index: number;
  date: string;
  cumR: number;
  peak: number;
  drawdown: number; // negative or zero
}

export function buildEquityCurve(trades: TradeLike[]): EquityPoint[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let cum = 0;
  let peak = 0;
  const points: EquityPoint[] = [
    { index: 0, date: "Start", cumR: 0, peak: 0, drawdown: 0 },
  ];
  sorted.forEach((t, i) => {
    cum = round2(cum + r(t));
    peak = Math.max(peak, cum);
    points.push({
      index: i + 1,
      date: new Date(t.date).toISOString().slice(0, 10),
      cumR: cum,
      peak,
      drawdown: round2(cum - peak),
    });
  });
  return points;
}

function maxDrawdownR(trades: TradeLike[]): number {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let cum = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of sorted) {
    cum += r(t);
    peak = Math.max(peak, cum);
    maxDd = Math.max(maxDd, peak - cum);
  }
  return maxDd;
}

// ── Breakdowns ────────────────────────────────────────────────
export interface BreakdownRow {
  key: string;
  label: string;
  stats: CoreStats;
}

function groupBy(
  trades: TradeLike[],
  keyFn: (t: TradeLike) => string | null,
  labelFn: (key: string) => string,
  order?: string[],
): BreakdownRow[] {
  const map = new Map<string, TradeLike[]>();
  for (const t of trades) {
    const k = keyFn(t);
    if (k == null) continue;
    const arr = map.get(k);
    if (arr) arr.push(t);
    else map.set(k, [t]);
  }
  let entries = [...map.entries()];
  if (order) {
    entries = entries.sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    );
  } else {
    entries = entries.sort((a, b) => a[0].localeCompare(b[0]));
  }
  return entries.map(([key, ts]) => ({
    key,
    label: labelFn(key),
    stats: computeStats(ts),
  }));
}

export interface AllBreakdowns {
  bySession: BreakdownRow[];
  byPoiType: BreakdownRow[];
  byPoiSize: BreakdownRow[];
  byReaction: BreakdownRow[];
  byWick: BreakdownRow[];
  bySentimentPre: BreakdownRow[];
  byFollowedPlan: BreakdownRow[];
  byInstrument: BreakdownRow[];
  byWeekday: BreakdownRow[];
  byHour: BreakdownRow[];
}

import { LABELS } from "./domain";

export function buildBreakdowns(trades: TradeLike[]): AllBreakdowns {
  const label = (group: keyof typeof LABELS) => (k: string) =>
    (LABELS[group] as Record<string, string>)[k] ?? k;

  return {
    bySession: groupBy(trades, (t) => t.session, label("session"), [
      "OVERNIGHT",
      "LONDON",
      "NY",
      "POST_NY",
    ]),
    byPoiType: groupBy(trades, (t) => t.entryPoiType, label("poiType"), [
      "IMBALANCE",
      "GAP",
      "DEVIL_MARK",
    ]),
    byPoiSize: groupBy(trades, (t) => t.poiSize, label("poiSize"), [
      "SMALL",
      "MEDIUM",
      "LARGE",
    ]),
    byReaction: groupBy(
      trades,
      (t) => String(t.reactionQuality),
      label("reaction"),
      ["CLEAN", "WEAK", "FORCED"],
    ),
    byWick: groupBy(
      trades,
      (t) => (t.noWick ? "NO_WICK" : "WITH_WICK"),
      (k) => (k === "NO_WICK" ? "Sans mèche" : "Avec mèche"),
      ["NO_WICK", "WITH_WICK"],
    ),
    bySentimentPre: groupBy(
      trades,
      (t) => (t.sentimentPre ? String(t.sentimentPre) : null),
      label("sentiment"),
    ),
    byFollowedPlan: groupBy(
      trades,
      (t) => (t.followedPlan ? "YES" : "NO"),
      (k) => (k === "YES" ? "Plan respecté" : "Plan NON respecté"),
      ["YES", "NO"],
    ),
    byInstrument: groupBy(
      trades,
      (t) => t.instrument,
      label("instrument"),
      ["MNQ", "MGC", "OTHER"],
    ),
    byWeekday: groupBy(
      trades,
      (t) => String(new Date(t.date).getUTCDay()),
      (k) => DAY_LABELS_FR[Number(k)] ?? k,
      ["1", "2", "3", "4", "5", "0", "6"],
    ),
    byHour: groupBy(
      trades,
      (t) => {
        if (!t.tapTimeUtc) return null;
        const m = /^(\d{1,2}):/.exec(t.tapTimeUtc.trim());
        return m ? String(Number(m[1])).padStart(2, "0") : null;
      },
      (k) => `${k}:00 UTC`,
    ),
  };
}

// ── helpers ──
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatR(n: number | null | undefined): string {
  if (n == null) return "—";
  const v = round2(n);
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}R`;
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatPf(n: number): string {
  if (n === Infinity) return "∞";
  return n.toFixed(2);
}
