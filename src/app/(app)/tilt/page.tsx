import { PageHeader } from "@/components/ui";
import { TiltJournal } from "@/components/TiltJournal";
import { TILT_TRIGGERS } from "@/lib/tilt";

export const metadata = { title: "Tilt — Mercure" };

export default function TiltPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Tilt"
        subtitle="Repère tes déclencheurs, journalise à chaud, coupe la spirale."
      />

      <TiltJournal />

      {/* Référence : tous les déclencheurs et leurs antidotes */}
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Comprendre tes déclencheurs
          </h2>
          <span className="chip">à relire au calme</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TILT_TRIGGERS.map((t) => (
            <div key={t.id} className="panel-soft p-4">
              <div className="font-display text-sm font-semibold text-ink">{t.label}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink-soft">Le tell — </span>
                {t.tell}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-accent">
                <span className="font-semibold">Antidote — </span>
                {t.antidote}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
