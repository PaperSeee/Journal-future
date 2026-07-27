"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  computeRrPlanned,
  sessionFromTapTime,
} from "@/lib/domain";
import { parseTradeForm, tradeInputSchema, type TradeInput } from "@/lib/validation";
import { isLegacyArray, mapLegacyTrade } from "@/lib/legacy";

// Auth temporairement désactivée — no-op.
async function requireAuth() {
  /* auth disabled */
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
  imported?: number;
}

/** Build the persisted record from a validated input (derives session + rrPlanned). */
function toRecord(input: TradeInput) {
  const rrPlanned =
    computeRrPlanned(input.entryPrice, input.stopPrice, input.targetPrice) ??
    null;
  return {
    date: input.date,
    instrument: input.instrument,
    direction: input.direction,
    strategy: input.strategy,
    htfBias: input.htfBias,
    entryPoiType: input.entryPoiType,
    entryPoi: input.entryPoi,
    targetZone: input.targetZone,
    tapTimeUtc: input.tapTimeUtc,
    session: sessionFromTapTime(input.tapTimeUtc),
    poiSize: input.poiSize,
    reactionQuality: input.reactionQuality,
    noWick: input.noWick,
    ibSession: input.ibSession ?? null,
    ibDirection: input.ibDirection ?? null,
    ibEntryTiming: input.ibEntryTiming ?? null,
    ibFvg: input.ibFvg ?? null,
    entryPrice: input.entryPrice,
    stopPrice: input.stopPrice,
    targetPrice: input.targetPrice,
    rrPlanned,
    result: input.result,
    rRealized: input.rRealized,
    followedPlan: input.followedPlan,
    sentimentPre: input.sentimentPre ?? null,
    sentimentPost: input.sentimentPost ?? null,
    note: input.note,
    screenshotUrl: input.screenshotUrl,
    tags: input.tags,
  };
}

function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createTrade(form: FormData): Promise<ActionResult> {
  await requireAuth();
  try {
    const input = parseTradeForm(form);
    const created = await prisma.trade.create({ data: toRecord(input) });
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath("/analytics");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: "Validation", fieldErrors: zodFieldErrors(e) };
    }
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateTrade(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  await requireAuth();
  try {
    const input = parseTradeForm(form);
    await prisma.trade.update({ where: { id }, data: toRecord(input) });
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath(`/journal/${id}`);
    revalidatePath("/analytics");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: "Validation", fieldErrors: zodFieldErrors(e) };
    }
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteTrade(id: string): Promise<ActionResult> {
  await requireAuth();
  try {
    await prisma.trade.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath("/analytics");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Import trades from JSON. Accepts both:
 *  - the app's own export (array of full trade objects), and
 *  - the legacy localStorage format (short-key objects).
 */
export async function importTrades(json: string): Promise<ActionResult> {
  await requireAuth();
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "JSON invalide." };
  }
  // Allow { trades: [...] } wrappers too.
  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed as { trades?: unknown[] })?.trades;
  if (!Array.isArray(arr) || arr.length === 0) {
    return { ok: false, error: "Aucun trade trouvé dans le fichier." };
  }

  try {
    if (isLegacyArray(arr)) {
      const records = arr.map((l) => mapLegacyTrade(l));
      const res = await prisma.trade.createMany({ data: records });
      revalidatePath("/");
      revalidatePath("/journal");
      revalidatePath("/analytics");
      return { ok: true, imported: res.count };
    }

    // Native format: validate each row, drop id/createdAt.
    const records = [];
    for (const raw of arr) {
      const row = raw as Record<string, unknown>;
      const cleaned = {
        ...row,
        date: row.date ?? new Date().toISOString(),
        tags: Array.isArray(row.tags) ? row.tags : [],
      };
      const input = tradeInputSchema.parse(cleaned);
      records.push(toRecord(input));
    }
    const res = await prisma.trade.createMany({ data: records });
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath("/analytics");
    return { ok: true, imported: res.count };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        error: "Format invalide : " + e.issues[0]?.message,
      };
    }
    return { ok: false, error: (e as Error).message };
  }
}
