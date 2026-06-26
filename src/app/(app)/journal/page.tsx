import { getTrades, getDistinctTags, parseFilters } from "@/lib/queries";
import { computeStats, formatPct, formatR } from "@/lib/stats";
import { toExportTrade, toTradeRow } from "@/lib/serialize";
import { Filters } from "@/components/Filters";
import { TradeList } from "@/components/TradeList";
import { ImportExport } from "@/components/ImportExport";
import { EmptyState, NewTradeButton, PageHeader } from "@/components/ui";

export const metadata = { title: "Journal — HqGambler" };
export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const [trades, tags] = await Promise.all([
    getTrades(filters),
    getDistinctTags(),
  ]);
  const stats = computeStats(trades.map(toTradeRow) as never);
  const rows = trades.map(toTradeRow);
  const exportData = trades.map(toExportTrade);
  const hasAny = trades.length > 0;
  const filtered = Object.keys(filters).length > 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Journal"
        subtitle="Tous les trades — filtrables et exportables"
        action={
          <div className="flex items-center gap-2">
            <ImportExport trades={exportData} />
            <NewTradeButton />
          </div>
        }
      />

      <Filters tags={tags} />

      {/* Filtered summary strip */}
      {hasAny && (
        <div className="panel mb-5 grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4">
          <SummaryCell label="Trades" value={String(stats.count)} />
          <SummaryCell label="Winrate" value={formatPct(stats.winrate)} />
          <SummaryCell label="Espérance" value={formatR(stats.expectancy)} tone={stats.expectancy} />
          <SummaryCell label="Total R" value={formatR(stats.totalR)} tone={stats.totalR} />
        </div>
      )}

      {hasAny ? (
        <TradeList trades={rows} />
      ) : filtered ? (
        <EmptyState
          title="Aucun trade ne correspond"
          description="Aucun trade ne matche ces filtres. Ajuste-les ou réinitialise."
        />
      ) : (
        <EmptyState
          title="Aucun trade pour l'instant"
          description="Commence à journaliser chaque trade selon ton modèle delivery entre imbalances HTF."
          action={<NewTradeButton />}
        />
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number;
}) {
  const color =
    tone == null ? "text-ink" : tone > 0 ? "text-win" : tone < 0 ? "text-loss" : "text-ink";
  return (
    <div className="bg-panel px-4 py-3">
      <div className="label">{label}</div>
      <div className={`mt-0.5 font-mono text-lg font-semibold tabular ${color}`}>{value}</div>
    </div>
  );
}
