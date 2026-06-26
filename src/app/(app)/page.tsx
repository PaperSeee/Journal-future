import Link from "next/link";
import { getAllTrades } from "@/lib/queries";
import { toTradeRow } from "@/lib/serialize";
import {
  buildEquityCurve,
  computeStats,
  formatPct,
  formatPf,
  formatR,
  type TradeLike,
} from "@/lib/stats";
import { StatCard } from "@/components/StatCard";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { WinLossBar } from "@/components/WinLossBar";
import { TradeList } from "@/components/TradeList";
import { EmptyState, NewTradeButton, PageHeader } from "@/components/ui";

export const metadata = { title: "Dashboard — HqGambler" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trades = await getAllTrades();
  const rows = trades.map(toTradeRow);
  const stats = computeStats(rows as unknown as TradeLike[]);
  const equity = buildEquityCurve(rows as unknown as TradeLike[]);
  const recent = rows.slice(0, 5);

  if (trades.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" subtitle="Ton edge, mesuré." action={<NewTradeButton />} />
        <EmptyState
          title="Bienvenue sur HqGambler"
          description="Aucune donnée pour l'instant. Enregistre ton premier trade pour voir ta courbe d'équité et tes stats se construire."
          action={<NewTradeButton />}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Dashboard" subtitle="Ton edge, mesuré." action={<NewTradeButton />} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Trades" value={stats.count} sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`} />
        <StatCard label="Winrate" value={formatPct(stats.winrate)} sub="hors break-even" tone="accent" />
        <StatCard
          label="Espérance"
          value={formatR(stats.expectancy)}
          sub="par trade"
          tone={stats.expectancy > 0 ? "win" : stats.expectancy < 0 ? "loss" : "neutral"}
        />
        <StatCard
          label="Total R"
          value={formatR(stats.totalR)}
          tone={stats.totalR > 0 ? "win" : stats.totalR < 0 ? "loss" : "neutral"}
        />
        <StatCard label="Profit factor" value={formatPf(stats.profitFactor)} sub="gains / pertes (R)" />
        <StatCard label="Max drawdown" value={`-${stats.maxDrawdown.toFixed(2)}R`} tone="loss" />
      </div>

      {/* Equity + distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
              Courbe d&apos;équité (R cumulé)
            </h2>
            <span className="chip">
              <span className="font-mono">{formatR(stats.totalR)}</span>
            </span>
          </div>
          <EquityCurve data={equity} />
        </div>

        <div className="panel flex flex-col p-5">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
            Répartition W / L / BE
          </h2>
          <div className="my-auto">
            <WinLossBar wins={stats.wins} losses={stats.losses} breakevens={stats.breakevens} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-soft pt-4 text-center">
            <div>
              <div className="label">RR plan. moyen</div>
              <div className="mt-0.5 font-mono text-lg font-semibold text-ink-soft tabular">
                {stats.avgRrPlanned != null ? stats.avgRrPlanned.toFixed(2) : "—"}
              </div>
            </div>
            <div>
              <div className="label">R réalisé moyen</div>
              <div
                className={`mt-0.5 font-mono text-lg font-semibold tabular ${
                  (stats.avgRrRealized ?? 0) >= 0 ? "text-win" : "text-loss"
                }`}
              >
                {stats.avgRrRealized != null ? formatR(stats.avgRrRealized) : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent trades */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
            5 derniers trades
          </h2>
          <Link href="/journal" className="text-sm text-accent hover:underline">
            Voir le journal →
          </Link>
        </div>
        <TradeList trades={recent} />
      </div>
    </div>
  );
}
