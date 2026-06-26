// Maps the legacy localStorage journal format into the new TradeInput shape.
// Legacy object: {date,inst,dir,bias,ein,cib,tap,size,reac,entry,stop,tgt,rrplan,res,r,note}

import {
  computeRrPlanned,
  type Direction,
  type Instrument,
  type PoiSize,
  type Reaction,
  type Result,
} from "./domain";

export interface LegacyTrade {
  date?: string;
  inst?: string;
  dir?: string;
  bias?: string;
  ein?: string; // entry POI
  cib?: string; // target zone (cible)
  tap?: string;
  size?: string;
  reac?: string;
  entry?: number | string;
  stop?: number | string;
  tgt?: number | string;
  rrplan?: number | string;
  res?: string;
  r?: number | string;
  note?: string;
}

const INSTRUMENT_MAP: Record<string, Instrument> = {
  MNQ: "MNQ",
  NQ: "MNQ",
  NASDAQ: "MNQ",
  MGC: "MGC",
  GC: "MGC",
  GOLD: "MGC",
  OR: "MGC",
};

const DIR_MAP: Record<string, Direction> = {
  LONG: "LONG",
  L: "LONG",
  BUY: "LONG",
  SHORT: "SHORT",
  S: "SHORT",
  SELL: "SHORT",
};

const SIZE_MAP: Record<string, PoiSize> = {
  SMALL: "SMALL",
  S: "SMALL",
  PETITE: "SMALL",
  MEDIUM: "MEDIUM",
  M: "MEDIUM",
  MOYENNE: "MEDIUM",
  LARGE: "LARGE",
  L: "LARGE",
  GROSSE: "LARGE",
  BIG: "LARGE",
};

const REAC_MAP: Record<string, Reaction> = {
  CLEAN: "CLEAN",
  FRANCHE: "CLEAN",
  WEAK: "WEAK",
  FAIBLE: "WEAK",
  FORCED: "FORCED",
  FORCEE: "FORCED",
};

const RESULT_MAP: Record<string, Result> = {
  WIN: "WIN",
  W: "WIN",
  TP: "WIN",
  GAGNE: "WIN",
  LOSS: "LOSS",
  L: "LOSS",
  SL: "LOSS",
  PERDU: "LOSS",
  BE: "BE",
  BREAKEVEN: "BE",
};

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function up(v: unknown): string {
  return String(v ?? "").trim().toUpperCase();
}

export interface MappedTrade {
  date: Date;
  instrument: Instrument;
  direction: Direction;
  htfBias: string;
  entryPoiType: "IMBALANCE";
  entryPoi: string;
  targetZone: string;
  tapTimeUtc: string | null;
  poiSize: PoiSize;
  reactionQuality: Reaction;
  noWick: boolean;
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  rrPlanned: number | null;
  result: Result;
  rRealized: number | null;
  followedPlan: boolean;
  note: string | null;
  tags: string[];
}

export function mapLegacyTrade(l: LegacyTrade): MappedTrade {
  const entry = num(l.entry);
  const stop = num(l.stop);
  const tgt = num(l.tgt);
  const rrPlanned = num(l.rrplan) ?? computeRrPlanned(entry, stop, tgt);
  const result = RESULT_MAP[up(l.res)] ?? "BE";

  const tap =
    l.tap && /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(l.tap).trim())
      ? String(l.tap).trim()
      : null;

  return {
    date: l.date ? new Date(l.date) : new Date(),
    instrument: INSTRUMENT_MAP[up(l.inst)] ?? "OTHER",
    direction: DIR_MAP[up(l.dir)] ?? "LONG",
    htfBias: l.bias?.trim() || "—",
    entryPoiType: "IMBALANCE",
    entryPoi: l.ein?.trim() || "—",
    targetZone: l.cib?.trim() || "—",
    tapTimeUtc: tap,
    poiSize: SIZE_MAP[up(l.size)] ?? "MEDIUM",
    reactionQuality: REAC_MAP[up(l.reac)] ?? "CLEAN",
    noWick: false,
    entryPrice: entry,
    stopPrice: stop,
    targetPrice: tgt,
    rrPlanned,
    result,
    rRealized: num(l.r) ?? (result === "LOSS" ? -1 : result === "BE" ? 0 : null),
    followedPlan: true,
    note: l.note?.trim() || null,
    tags: ["import-legacy"],
  };
}

/** Detect whether a parsed JSON array is the legacy format. */
export function isLegacyArray(arr: unknown): arr is LegacyTrade[] {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const first = arr[0] as Record<string, unknown>;
  // Legacy uses short keys like `inst`, `ein`, `cib`, `rrplan`.
  return (
    "inst" in first ||
    "ein" in first ||
    "cib" in first ||
    "rrplan" in first ||
    "reac" in first
  );
}
