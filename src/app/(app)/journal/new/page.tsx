import { PageHeader } from "@/components/ui";
import { TradeForm } from "@/components/TradeForm";

export const metadata = { title: "Nouveau trade — HqGambler" };

export default function NewTradePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nouveau trade"
        subtitle="Delivery entre imbalances HTF — entrée sur réaction"
      />
      <TradeForm mode="create" />
    </div>
  );
}
