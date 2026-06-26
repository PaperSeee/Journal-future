import { getTrades, getDistinctTags, parseFilters } from "@/lib/queries";
import { toTradeRow } from "@/lib/serialize";
import {
  buildBreakdowns,
  computeStats,
  formatPct,
  formatPf,
  formatR,
  type TradeLike,
} from "@/lib/stats";
import { NEGATIVE_SENTIMENTS } from "@/lib/domain";
import { Filters } from "@/components/Filters";
import { BreakdownTable, RrComparison } from "@/components/BreakdownTable";
import { StatCard } from "@/components/StatCard";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Analytics — HqGambler" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const [trades, tags] = await Promise.all([getTrades(filters), getDistinctTags()]);
  const rows = trades.map(toTradeRow) as unknown as TradeLike[];
  const stats = computeStats(rows);
  const b = buildBreakdowns(rows);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Test d'hypothèses — où se cache (ou se perd) ton edge."
      />

      <Filters tags={tags} />

      {trades.length === 0 ? (
        <EmptyState
          title="Pas assez de données"
          description="Les breakdowns apparaîtront dès que tu auras journalisé des trades correspondant aux filtres."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard label="Trades" value={stats.count} />
            <StatCard label="Winrate" value={formatPct(stats.winrate)} tone="accent" />
            <StatCard
              label="Espérance"
              value={formatR(stats.expectancy)}
              tone={stats.expectancy >= 0 ? "win" : "loss"}
            />
            <StatCard
              label="Total R"
              value={formatR(stats.totalR)}
              tone={stats.totalR >= 0 ? "win" : "loss"}
            />
            <StatCard label="Profit factor" value={formatPf(stats.profitFactor)} />
          </div>

          {/* RR planned vs realized */}
          <RrComparison avgPlanned={stats.avgRrPlanned} avgRealized={stats.avgRrRealized} />

          {/* Breakdown grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable
              title="Par session"
              hint="hypothèse ① overnight"
              rows={b.bySession}
              highlightKeys={["OVERNIGHT"]}
            />
            <BreakdownTable
              title="Par type de POI"
              hint="hypothèse ③ devil's mark"
              rows={b.byPoiType}
              highlightKeys={["DEVIL_MARK"]}
            />
            <BreakdownTable
              title="Par taille de POI"
              hint="hypothèse ② grosse zone"
              rows={b.byPoiSize}
              highlightKeys={["LARGE"]}
            />
            <BreakdownTable title="Par qualité de réaction" rows={b.byReaction} highlightKeys={["FORCED"]} />
            <BreakdownTable title="Bougie : sans mèche vs avec mèche" rows={b.byWick} />
            <BreakdownTable
              title="Par sentiment pré-trade"
              hint="FOMO / revenge perdent-ils plus ?"
              rows={b.bySentimentPre}
              highlightKeys={NEGATIVE_SENTIMENTS}
            />
            <BreakdownTable
              title="Plan respecté vs non"
              rows={b.byFollowedPlan}
              highlightKeys={["NO"]}
            />
            <BreakdownTable title="Par instrument" rows={b.byInstrument} />
            <BreakdownTable title="Par jour de semaine" rows={b.byWeekday} />
            <BreakdownTable title="Par heure (UTC du tap)" rows={b.byHour} />
          </div>

          <p className="text-center text-xs text-ink-dim">
            Toutes les stats sont recalculées sur le sous-ensemble filtré ci-dessus.
          </p>
        </>
      )}
    </div>
  );
}
