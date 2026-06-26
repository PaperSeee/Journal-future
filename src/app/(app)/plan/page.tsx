import { PageHeader } from "@/components/ui";
import { PreTradeChecklist } from "@/components/PreTradeChecklist";
import {
  HYPOTHESES,
  MODEL_DESCRIPTION,
  MODEL_NAME,
  NON_NEGOTIABLES,
  VALID_LOSS,
} from "@/lib/plan";

export const metadata = { title: "Plan — HqGambler" };

export default function PlanPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Plan" subtitle={MODEL_NAME} />

      {/* Model description */}
      <section className="panel relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Le modèle
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
          {MODEL_DESCRIPTION.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* Interactive checklist */}
      <PreTradeChecklist />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Valid loss */}
        <section className="panel p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-win">
            <ShieldIcon className="h-4 w-4" />
            Perte valide = bon trade
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{VALID_LOSS}</p>
        </section>

        {/* Non-negotiables */}
        <section className="panel p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-loss">
            <LockIcon className="h-4 w-4" />
            Non négociables
          </h2>
          <ul className="mt-3 space-y-2">
            {NON_NEGOTIABLES.map((n, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-loss" />
                {n}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Hypotheses under test */}
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            <FlaskIcon className="h-4 w-4" />
            À surveiller — hypothèses en test
          </h2>
          <span className="chip">pas des règles</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {HYPOTHESES.map((h) => (
            <div key={h.tag} className="panel-soft p-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-semibold text-accent">{h.tag}</span>
                <span className="font-medium">{h.title}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink-dim">{h.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-dim">
          Ces hypothèses se valident dans <span className="text-accent">Analytics</span> — pas à l&apos;instinct.
        </p>
      </section>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v6L4 18a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V2M9 2h6M7.5 14h9" />
    </svg>
  );
}
