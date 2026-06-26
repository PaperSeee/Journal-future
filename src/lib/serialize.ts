import type { Trade } from "@prisma/client";
import type { TradeRow } from "@/components/TradeList";
import type { ExportTrade } from "@/lib/export";

/** Trade → plain row for the client list (Dates → ISO strings). */
export function toTradeRow(t: Trade): TradeRow {
  return {
    id: t.id,
    date: t.date.toISOString(),
    instrument: t.instrument,
    direction: t.direction,
    session: t.session,
    entryPoiType: t.entryPoiType,
    poiSize: t.poiSize,
    entryPoi: t.entryPoi,
    targetZone: t.targetZone,
    reactionQuality: t.reactionQuality,
    noWick: t.noWick,
    result: t.result,
    rRealized: t.rRealized,
    rrPlanned: t.rrPlanned,
    followedPlan: t.followedPlan,
    sentimentPre: t.sentimentPre,
    tags: t.tags,
    screenshotUrl: t.screenshotUrl,
  };
}

/** Trade → flat export object (no base64 screenshot to keep files small). */
export function toExportTrade(t: Trade): ExportTrade {
  return {
    date: t.date.toISOString().slice(0, 10),
    instrument: t.instrument,
    direction: t.direction,
    htfBias: t.htfBias,
    entryPoiType: t.entryPoiType,
    entryPoi: t.entryPoi,
    targetZone: t.targetZone,
    tapTimeUtc: t.tapTimeUtc,
    session: t.session,
    poiSize: t.poiSize,
    reactionQuality: t.reactionQuality,
    noWick: t.noWick,
    entryPrice: t.entryPrice,
    stopPrice: t.stopPrice,
    targetPrice: t.targetPrice,
    rrPlanned: t.rrPlanned,
    result: t.result,
    rRealized: t.rRealized,
    followedPlan: t.followedPlan,
    sentimentPre: t.sentimentPre,
    sentimentPost: t.sentimentPost,
    note: t.note,
    tags: t.tags,
  };
}
