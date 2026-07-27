// Domain enums (mirrors Prisma) + human labels + derivation helpers.
// Kept framework-free so it can be imported anywhere (client or server).

export const INSTRUMENTS = ["MNQ", "MGC", "OTHER"] as const;
export const DIRECTIONS = ["LONG", "SHORT"] as const;
export const STRATEGIES = ["HTF_IMBALANCE", "IB"] as const;
export const IB_SESSIONS = ["ASIA", "LONDON", "NEW_YORK"] as const;
export const IB_DIRECTIONS = ["BULLISH", "BEARISH"] as const;
export const IB_ENTRY_TIMINGS = ["BEFORE_IB_CLOSE", "AFTER_IB_CLOSE"] as const;
export const IB_FVGS = ["NONE", "M5", "M15"] as const;
export const POI_TYPES = ["IMBALANCE", "GAP", "DEVIL_MARK"] as const;
export const POI_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
export const REACTIONS = ["CLEAN", "WEAK", "FORCED"] as const;
export const RESULTS = ["WIN", "LOSS", "BE"] as const;
export const SESSIONS = ["OVERNIGHT", "LONDON", "NY", "POST_NY"] as const;
export const SENTIMENTS = [
  "CALM",
  "CONFIDENT",
  "NEUTRAL",
  "FOMO",
  "ANXIOUS",
  "REVENGE",
  "TILTED",
  "HESITANT",
] as const;

export type Instrument = (typeof INSTRUMENTS)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type Strategy = (typeof STRATEGIES)[number];
export type IbSession = (typeof IB_SESSIONS)[number];
export type IbDirection = (typeof IB_DIRECTIONS)[number];
export type IbEntryTiming = (typeof IB_ENTRY_TIMINGS)[number];
export type IbFvg = (typeof IB_FVGS)[number];
export type PoiType = (typeof POI_TYPES)[number];
export type PoiSize = (typeof POI_SIZES)[number];
export type Reaction = (typeof REACTIONS)[number];
export type Result = (typeof RESULTS)[number];
export type Session = (typeof SESSIONS)[number];
export type Sentiment = (typeof SENTIMENTS)[number];

export const LABELS = {
  instrument: {
    MNQ: "MNQ — Nasdaq",
    MGC: "MGC — Gold",
    OTHER: "Autre",
  } satisfies Record<Instrument, string>,
  direction: {
    LONG: "Long",
    SHORT: "Short",
  } satisfies Record<Direction, string>,
  strategy: {
    HTF_IMBALANCE: "HTF — Imbalances",
    IB: "IB — Initial Balance",
  } satisfies Record<Strategy, string>,
  ibSession: {
    ASIA: "Asia",
    LONDON: "London",
    NEW_YORK: "New York",
  } satisfies Record<IbSession, string>,
  ibDirection: {
    BULLISH: "IB haussier",
    BEARISH: "IB baissier",
  } satisfies Record<IbDirection, string>,
  ibEntryTiming: {
    BEFORE_IB_CLOSE: "Avant la fin de l'IB",
    AFTER_IB_CLOSE: "Après clôture de l'IB",
  } satisfies Record<IbEntryTiming, string>,
  ibFvg: {
    NONE: "Sans FVG",
    M5: "FVG M5",
    M15: "FVG M15",
  } satisfies Record<IbFvg, string>,
  poiType: {
    IMBALANCE: "Imbalance",
    GAP: "Gap",
    DEVIL_MARK: "Devil's mark",
  } satisfies Record<PoiType, string>,
  poiSize: {
    SMALL: "Petite",
    MEDIUM: "Moyenne",
    LARGE: "Grosse",
  } satisfies Record<PoiSize, string>,
  reaction: {
    CLEAN: "Franche (clean)",
    WEAK: "Faible",
    FORCED: "Forcée",
  } satisfies Record<Reaction, string>,
  result: {
    WIN: "Win",
    LOSS: "Loss",
    BE: "Break-even",
  } satisfies Record<Result, string>,
  session: {
    OVERNIGHT: "Overnight",
    LONDON: "Londres",
    NY: "New York",
    POST_NY: "Post-NY",
  } satisfies Record<Session, string>,
  sentiment: {
    CALM: "Calme",
    CONFIDENT: "Confiant",
    NEUTRAL: "Neutre",
    FOMO: "FOMO",
    ANXIOUS: "Anxieux",
    REVENGE: "Revenge",
    TILTED: "Tilté",
    HESITANT: "Hésitant",
  } satisfies Record<Sentiment, string>,
} as const;

// Sentiments considered "negative" / risk states for analytics highlighting.
export const NEGATIVE_SENTIMENTS: Sentiment[] = [
  "FOMO",
  "REVENGE",
  "TILTED",
  "ANXIOUS",
];

/** Derive the trading session bucket from a "HH:MM" tap time in UTC+2 (heure locale). */
export function sessionFromTapTime(tapTimeUtc?: string | null): Session | null {
  if (!tapTimeUtc) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(tapTimeUtc.trim());
  if (!match) return null;
  const h = Number(match[1]);
  if (Number.isNaN(h) || h < 0 || h > 23) return null;
  // En UTC+2 : 00-09 OVERNIGHT, 09-15 LONDON, 15-23 NY, 23-24 POST_NY
  if (h < 9) return "OVERNIGHT";
  if (h < 15) return "LONDON";
  if (h < 23) return "NY";
  return "POST_NY";
}

/** Planned RR from prices: |target-entry| / |entry-stop|. */
export function computeRrPlanned(
  entry?: number | null,
  stop?: number | null,
  target?: number | null,
): number | null {
  if (entry == null || stop == null || target == null) return null;
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const reward = Math.abs(target - entry);
  return Math.round((reward / risk) * 100) / 100;
}

/** Default R realized suggestion from a result (LOSS → -1, BE → 0). */
export function defaultRealizedR(result: Result): number | null {
  if (result === "LOSS") return -1;
  if (result === "BE") return 0;
  return null; // WIN must be entered explicitly
}

export const DAY_LABELS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;
