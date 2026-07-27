import { z } from "zod";
import {
  DIRECTIONS,
  INSTRUMENTS,
  POI_SIZES,
  POI_TYPES,
  REACTIONS,
  RESULTS,
  SENTIMENTS,
  STRATEGIES,
  IB_SESSIONS,
  IB_DIRECTIONS,
  IB_ENTRY_TIMINGS,
  IB_FVGS,
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
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Format HH:MM (UTC+2) attendu")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null))
  .nullable();

export const tradeInputSchema = z
  .object({
    date: z.coerce.date({ errorMap: () => ({ message: "Date invalide" }) }),
    instrument: z.enum(INSTRUMENTS),
    direction: z.enum(DIRECTIONS),
    strategy: z.enum(STRATEGIES).default("HTF_IMBALANCE"),

    // HTF — optionnels au niveau schéma, exigés seulement si strategy = HTF (superRefine).
    htfBias: optionalString,
    entryPoiType: z.enum(POI_TYPES).optional().nullable(),
    entryPoi: optionalString,
    targetZone: optionalString,
    tapTimeUtc: tapTimeSchema,
    poiSize: z.enum(POI_SIZES).optional().nullable(),
    reactionQuality: z.enum(REACTIONS).optional().nullable(),
    noWick: z.coerce.boolean().default(false),

    // IB — optionnels au niveau schéma, exigés seulement si strategy = IB.
    ibSession: z.enum(IB_SESSIONS).optional().nullable(),
    ibDirection: z.enum(IB_DIRECTIONS).optional().nullable(),
    ibEntryTiming: z.enum(IB_ENTRY_TIMINGS).optional().nullable(),
    ibFvg: z.enum(IB_FVGS).optional().nullable(),

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
  })
  .superRefine((v, ctx) => {
    if (v.strategy === "HTF_IMBALANCE") {
      const req: [keyof typeof v, string][] = [
        ["htfBias", "Le biais HTF est requis"],
        ["entryPoiType", "Le type de POI est requis"],
        ["entryPoi", "L'imbalance d'entrée est requise"],
        ["targetZone", "La zone cible est requise"],
        ["poiSize", "La taille du POI est requise"],
        ["reactionQuality", "La réaction est requise"],
      ];
      for (const [field, message] of req) {
        if (v[field] == null || v[field] === "") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
        }
      }
    } else if (v.strategy === "IB") {
      const req: [keyof typeof v, string][] = [
        ["ibSession", "La session IB est requise"],
        ["ibDirection", "Le biais de l'IB est requis"],
        ["ibEntryTiming", "Le timing d'entrée est requis"],
      ];
      for (const [field, message] of req) {
        if (v[field] == null || v[field] === "") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
        }
      }
    }
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
  // Un enum optionnel : "" → null (sinon zod refuse la chaîne vide).
  const optEnum = (k: string) => {
    const v = get(k);
    return v && v !== "" ? v : null;
  };

  return tradeInputSchema.parse({
    date: get("date"),
    instrument: get("instrument"),
    direction: get("direction"),
    strategy: get("strategy") ?? "HTF_IMBALANCE",
    htfBias: get("htfBias") ?? "",
    entryPoiType: optEnum("entryPoiType"),
    entryPoi: get("entryPoi") ?? "",
    targetZone: get("targetZone") ?? "",
    tapTimeUtc: get("tapTimeUtc") ?? "",
    poiSize: optEnum("poiSize"),
    reactionQuality: optEnum("reactionQuality"),
    noWick: checkbox("noWick"),
    ibSession: optEnum("ibSession"),
    ibDirection: optEnum("ibDirection"),
    ibEntryTiming: optEnum("ibEntryTiming"),
    ibFvg: optEnum("ibFvg"),
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
