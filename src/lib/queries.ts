import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { filterSchema, type FilterInput } from "./validation";

/** Parse a Next.js searchParams object into a validated filter. */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): FilterInput {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string" && v.length > 0) flat[k] = v;
    else if (Array.isArray(v) && v[0]) flat[k] = v[0];
  }
  const parsed = filterSchema.safeParse(flat);
  return parsed.success ? parsed.data : {};
}

/** Build a Prisma where clause from filters. */
export function buildWhere(f: FilterInput): Prisma.TradeWhereInput {
  const where: Prisma.TradeWhereInput = {};
  if (f.instrument) where.instrument = f.instrument;
  if (f.session) where.session = f.session;
  if (f.poiSize) where.poiSize = f.poiSize;
  if (f.poiType) where.entryPoiType = f.poiType;
  if (f.reaction) where.reactionQuality = f.reaction;
  if (f.sentiment) where.sentimentPre = f.sentiment;
  if (f.result) where.result = f.result;
  if (f.followedPlan) where.followedPlan = f.followedPlan === "true";
  if (f.tag) where.tags = { has: f.tag };
  if (f.from || f.to) {
    where.date = {};
    if (f.from) where.date.gte = new Date(f.from);
    if (f.to) {
      // include the whole "to" day
      const end = new Date(f.to);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }
  return where;
}

export async function getTrades(f: FilterInput = {}) {
  return prisma.trade.findMany({
    where: buildWhere(f),
    orderBy: { date: "desc" },
  });
}

export async function getAllTrades() {
  return prisma.trade.findMany({ orderBy: { date: "desc" } });
}

export async function getTradeById(id: string) {
  return prisma.trade.findUnique({ where: { id } });
}

export async function getDistinctTags(): Promise<string[]> {
  const rows = await prisma.trade.findMany({ select: { tags: true } });
  const set = new Set<string>();
  for (const r of rows) for (const t of r.tags) set.add(t);
  return [...set].sort();
}
