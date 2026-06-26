import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { TradeForm, type TradeFormValues } from "@/components/TradeForm";
import { getTradeById } from "@/lib/queries";

export const metadata = { title: "Éditer un trade — HqGambler" };

export default async function EditTradePage({
  params,
}: {
  params: { id: string };
}) {
  const trade = await getTradeById(params.id);
  if (!trade) notFound();

  const initial: Partial<TradeFormValues> = {
    id: trade.id,
    date: new Date(trade.date).toISOString().slice(0, 10),
    instrument: trade.instrument,
    direction: trade.direction,
    htfBias: trade.htfBias,
    entryPoiType: trade.entryPoiType,
    entryPoi: trade.entryPoi,
    targetZone: trade.targetZone,
    tapTimeUtc: trade.tapTimeUtc ?? "",
    poiSize: trade.poiSize,
    reactionQuality: trade.reactionQuality,
    noWick: trade.noWick,
    entryPrice: trade.entryPrice?.toString() ?? "",
    stopPrice: trade.stopPrice?.toString() ?? "",
    targetPrice: trade.targetPrice?.toString() ?? "",
    result: trade.result,
    rRealized: trade.rRealized?.toString() ?? "",
    followedPlan: trade.followedPlan,
    sentimentPre: trade.sentimentPre ?? "",
    sentimentPost: trade.sentimentPost ?? "",
    note: trade.note ?? "",
    screenshotUrl: trade.screenshotUrl ?? "",
    tags: trade.tags.join(", "),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Éditer le trade" />
      <TradeForm mode="edit" initial={initial} />
    </div>
  );
}
