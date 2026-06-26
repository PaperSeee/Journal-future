// Seed a handful of realistic trades so the dashboard/analytics aren't empty
// on first run. Safe to run multiple times only on a fresh DB — it checks first.
import { PrismaClient } from "@prisma/client";
import { computeRrPlanned, sessionFromTapTime } from "../src/lib/domain";

const prisma = new PrismaClient();

type Seed = {
  daysAgo: number;
  instrument: "MNQ" | "MGC";
  direction: "LONG" | "SHORT";
  htfBias: string;
  entryPoiType: "IMBALANCE" | "GAP" | "DEVIL_MARK";
  entryPoi: string;
  targetZone: string;
  tap: string;
  poiSize: "SMALL" | "MEDIUM" | "LARGE";
  reaction: "CLEAN" | "WEAK" | "FORCED";
  noWick: boolean;
  entry: number;
  stop: number;
  target: number;
  result: "WIN" | "LOSS" | "BE";
  r: number;
  followedPlan: boolean;
  sentimentPre: string;
  note: string;
  tags: string[];
};

const SEEDS: Seed[] = [
  { daysAgo: 18, instrument: "MNQ", direction: "LONG", htfBias: "draw vers H4 buy-side 18250", entryPoiType: "IMBALANCE", entryPoi: "H1 18080-18110", targetZone: "H4 18250", tap: "14:10", poiSize: "MEDIUM", reaction: "CLEAN", noWick: true, entry: 18100, stop: 18075, target: 18250, result: "WIN", r: 3.2, followedPlan: true, sentimentPre: "CALM", note: "Réaction clean no-wick, livraison franche.", tags: ["A+"] },
  { daysAgo: 17, instrument: "MGC", direction: "SHORT", htfBias: "draw vers H4 sell-side 2318", entryPoiType: "GAP", entryPoi: "H1 2342-2345", targetZone: "H4 2318", tap: "13:35", poiSize: "SMALL", reaction: "CLEAN", noWick: false, entry: 2343, stop: 2347, target: 2318, result: "WIN", r: 2.6, followedPlan: true, sentimentPre: "CONFIDENT", note: "Gap comblé, beau move NY.", tags: [] },
  { daysAgo: 15, instrument: "MNQ", direction: "SHORT", htfBias: "sell-side liquidity 17900", entryPoiType: "DEVIL_MARK", entryPoi: "H1 18040", targetZone: "H4 17900", tap: "02:20", poiSize: "MEDIUM", reaction: "WEAK", noWick: false, entry: 18040, stop: 18062, target: 17900, result: "LOSS", r: -1, followedPlan: true, sentimentPre: "NEUTRAL", note: "Overnight, peu de liquidité — SL propre.", tags: ["overnight"] },
  { daysAgo: 14, instrument: "MNQ", direction: "LONG", htfBias: "draw vers H4 18400", entryPoiType: "IMBALANCE", entryPoi: "H1 18210-18240", targetZone: "H4 18400", tap: "15:05", poiSize: "LARGE", reaction: "FORCED", noWick: false, entry: 18230, stop: 18195, target: 18400, result: "LOSS", r: -1, followedPlan: false, sentimentPre: "FOMO", note: "Grosse zone, entrée imprécise, FOMO. À raffiner.", tags: ["grosse-zone"] },
  { daysAgo: 12, instrument: "MGC", direction: "LONG", htfBias: "draw vers H4 2360", entryPoiType: "IMBALANCE", entryPoi: "H1 2330-2333", targetZone: "H4 2360", tap: "14:40", poiSize: "MEDIUM", reaction: "CLEAN", noWick: true, entry: 2331, stop: 2327, target: 2360, result: "WIN", r: 4.1, followedPlan: true, sentimentPre: "CALM", note: "Textbook. No-wick, RR dynamique respecté.", tags: ["A+"] },
  { daysAgo: 11, instrument: "MNQ", direction: "SHORT", htfBias: "sell-side 17800", entryPoiType: "IMBALANCE", entryPoi: "H1 17980-18010", targetZone: "H4 17800", tap: "13:50", poiSize: "SMALL", reaction: "CLEAN", noWick: false, entry: 17995, stop: 18020, target: 17800, result: "BE", r: 0, followedPlan: true, sentimentPre: "NEUTRAL", note: "Sortie au BE, momentum mou.", tags: [] },
  { daysAgo: 8, instrument: "MNQ", direction: "LONG", htfBias: "draw vers H4 18550", entryPoiType: "DEVIL_MARK", entryPoi: "H1 18380", targetZone: "H4 18550", tap: "16:20", poiSize: "MEDIUM", reaction: "CLEAN", noWick: true, entry: 18382, stop: 18360, target: 18550, result: "WIN", r: 3.0, followedPlan: true, sentimentPre: "CONFIDENT", note: "Devil's mark a tenu cette fois.", tags: ["devil"] },
  { daysAgo: 7, instrument: "MGC", direction: "SHORT", htfBias: "sell-side 2300", entryPoiType: "GAP", entryPoi: "H1 2328-2331", targetZone: "H4 2300", tap: "13:20", poiSize: "MEDIUM", reaction: "WEAK", noWick: false, entry: 2329, stop: 2333, target: 2300, result: "LOSS", r: -1, followedPlan: true, sentimentPre: "CALM", note: "Réaction faible, SL valide.", tags: [] },
  { daysAgo: 5, instrument: "MNQ", direction: "SHORT", htfBias: "draw vers sell-side 18100", entryPoiType: "IMBALANCE", entryPoi: "H1 18300-18330", targetZone: "H4 18100", tap: "14:55", poiSize: "MEDIUM", reaction: "CLEAN", noWick: true, entry: 18315, stop: 18340, target: 18100, result: "WIN", r: 2.8, followedPlan: true, sentimentPre: "CALM", note: "Bon trade, discipliné.", tags: ["A+"] },
  { daysAgo: 3, instrument: "MNQ", direction: "LONG", htfBias: "draw vers 18700", entryPoiType: "IMBALANCE", entryPoi: "H1 18520-18550", targetZone: "H4 18700", tap: "21:30", poiSize: "MEDIUM", reaction: "FORCED", noWick: false, entry: 18540, stop: 18510, target: 18700, result: "LOSS", r: -1, followedPlan: false, sentimentPre: "REVENGE", note: "Post-NY, revenge après le loss précédent. Erreur.", tags: ["revenge", "post-ny"] },
  { daysAgo: 1, instrument: "MGC", direction: "LONG", htfBias: "draw vers H4 2375", entryPoiType: "IMBALANCE", entryPoi: "H1 2348-2351", targetZone: "H4 2375", tap: "14:15", poiSize: "SMALL", reaction: "CLEAN", noWick: true, entry: 2349, stop: 2345, target: 2375, result: "WIN", r: 3.5, followedPlan: true, sentimentPre: "CALM", note: "Petite zone précise, exécution propre.", tags: ["A+"] },
];

async function main() {
  const existing = await prisma.trade.count();
  if (existing > 0) {
    console.log(`Seed skipped — ${existing} trade(s) already present.`);
    return;
  }
  const now = Date.now();
  for (const s of SEEDS) {
    const date = new Date(now - s.daysAgo * 86400000);
    await prisma.trade.create({
      data: {
        date,
        instrument: s.instrument,
        direction: s.direction,
        htfBias: s.htfBias,
        entryPoiType: s.entryPoiType,
        entryPoi: s.entryPoi,
        targetZone: s.targetZone,
        tapTimeUtc: s.tap,
        session: sessionFromTapTime(s.tap),
        poiSize: s.poiSize,
        reactionQuality: s.reaction,
        noWick: s.noWick,
        entryPrice: s.entry,
        stopPrice: s.stop,
        targetPrice: s.target,
        rrPlanned: computeRrPlanned(s.entry, s.stop, s.target),
        result: s.result,
        rRealized: s.r,
        followedPlan: s.followedPlan,
        sentimentPre: s.sentimentPre as never,
        note: s.note,
        tags: s.tags,
      },
    });
  }
  console.log(`✓ Seeded ${SEEDS.length} trades.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
