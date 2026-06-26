import { z } from "zod";
import {
  DIRECTIONS,
  INSTRUMENTS,
  POI_SIZES,
  POI_TYPES,
  REACTIONS,
  RESULTS,
  SENTIMENTS,
} from "./domain";

const optionalNumber = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (v === "" || v == null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .nullable();

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

const tapTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Format HH:MM (UTC) attendu")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

export const tradeInputSchema = z.object({
  date: z.coerce.date({ errorMap: () => ({ message: "Date invalide" }) }),
  instrument: z.enum(INSTRUMENTS),
  direction: z.enum(DIRECTIONS),

  htfBias: z.string().trim().min(1, "Le biais HTF est requis"),
  entryPoiType: z.enum(POI_TYPES),
  entryPoi: z.string().trim().min(1, "Le POI d'entrée est requis"),
  targetZone: z.string().trim().min(1, "La zone cible est requise"),
  tapTimeUtc: tapTimeSchema,
  poiSize: z.enum(POI_SIZES),
  reactionQuality: z.enum(REACTIONS),
  noWick: z.coerce.boolean().default(false),

  entryPrice: optionalNumber,
  stopPrice: optionalNumber,
  targetPrice: optionalNumber,
  result: z.enum(RESULTS),
  rRealized: optionalNumber,

  followedPlan: z.coerce.boolean().default(true),
  sentimentPre: z.enum(SENTIMENTS).optional().nullable(),
  sentimentPost: z.enum(SENTIMENTS).optional().nullable(),
  note: optionalString,
  screenshotUrl: optionalString,
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type TradeInput = z.infer<typeof tradeInputSchema>;

/** Parse FormData (from the trade form) into a validated TradeInput. */
export function parseTradeForm(form: FormData): TradeInput {
  const get = (k: string) => {
    const v = form.get(k);
    return v == null ? undefined : String(v);
  };
  const checkbox = (k: string) => form.get(k) === "on" || form.get(k) === "true";

  const tagsRaw = get("tags") ?? "";
  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentimentPre = get("sentimentPre");
  const sentimentPost = get("sentimentPost");

  return tradeInputSchema.parse({
    date: get("date"),
    instrument: get("instrument"),
    direction: get("direction"),
    htfBias: get("htfBias") ?? "",
    entryPoiType: get("entryPoiType"),
    entryPoi: get("entryPoi") ?? "",
    targetZone: get("targetZone") ?? "",
    tapTimeUtc: get("tapTimeUtc") ?? "",
    poiSize: get("poiSize"),
    reactionQuality: get("reactionQuality"),
    noWick: checkbox("noWick"),
    entryPrice: get("entryPrice") ?? "",
    stopPrice: get("stopPrice") ?? "",
    targetPrice: get("targetPrice") ?? "",
    result: get("result"),
    rRealized: get("rRealized") ?? "",
    followedPlan: checkbox("followedPlan"),
    sentimentPre: sentimentPre && sentimentPre !== "" ? sentimentPre : null,
    sentimentPost: sentimentPost && sentimentPost !== "" ? sentimentPost : null,
    note: get("note") ?? "",
    screenshotUrl: get("screenshotUrl") ?? "",
    tags,
  });
}

// Filter schema for the journal/analytics querystring.
export const filterSchema = z.object({
  instrument: z.enum(INSTRUMENTS).optional(),
  session: z.enum(["OVERNIGHT", "LONDON", "NY", "POST_NY"]).optional(),
  poiSize: z.enum(POI_SIZES).optional(),
  poiType: z.enum(POI_TYPES).optional(),
  reaction: z.enum(REACTIONS).optional(),
  sentiment: z.enum(SENTIMENTS).optional(),
  result: z.enum(RESULTS).optional(),
  followedPlan: z.enum(["true", "false"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  tag: z.string().optional(),
});

export type FilterInput = z.infer<typeof filterSchema>;
