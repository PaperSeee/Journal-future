"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LABELS } from "@/lib/domain";
import { deleteTrade } from "@/app/actions";
import { useToast } from "@/components/Toast";
import { RCell, ResultBadge } from "@/components/ui";

export interface TradeRow {
  id: string;
  date: string; // ISO
  instrument: string;
  direction: string;
  strategy: string;
  session: string | null;
  entryPoiType: string | null;
  poiSize: string | null;
  entryPoi: string | null;
  targetZone: string | null;
  reactionQuality: string | null;
  noWick: boolean;
  ibSession: string | null;
  ibDirection: string | null;
  ibEntryTiming: string | null;
  ibFvg: string | null;
  result: string;
  rRealized: number | null;
  rrPlanned: number | null;
  followedPlan: boolean;
  sentimentPre: string | null;
  tags: string[];
  screenshotUrl: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const toast = useToast();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteTrade(id);
      if (res.ok) {
        toast.push("Trade supprimé", "info");
        router.refresh();
      } else {
        toast.push(res.error ?? "Erreur", "error");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-ink-dim transition hover:text-loss"
        aria-label="Supprimer"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDelete} disabled={pending} className="text-xs font-medium text-loss hover:underline">
        {pending ? "…" : "Confirmer"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-ink-dim hover:underline">
        Non
      </button>
    </div>
  );
}

export function TradeList({ trades }: { trades: TradeRow[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-ink-dim">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Inst.</th>
                <th className="px-4 py-3 font-medium">Dir.</th>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Imbalance</th>
                <th className="px-4 py-3 font-medium">Réaction</th>
                <th className="px-4 py-3 text-right font-medium">RR plan</th>
                <th className="px-4 py-3 text-center font-medium">Rés.</th>
                <th className="px-4 py-3 text-right font-medium">R</th>
                <th className="px-4 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr
                  key={t.id}
                  className="group border-b border-border-soft transition last:border-0 hover:bg-panel-hover/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-soft">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3 font-medium">{t.instrument}</td>
                  <td className="px-4 py-3">
                    <span className={t.direction === "LONG" ? "text-win" : "text-loss"}>
                      {t.direction === "LONG" ? "Long" : "Short"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {t.session ? LABELS.session[t.session as keyof typeof LABELS.session] : "—"}
                  </td>
                  <td className="max-w-[180px] px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="chip !px-2 !py-0.5">
                        {LABELS.poiSize[t.poiSize as keyof typeof LABELS.poiSize]}
                      </span>
                      <span className="max-w-[110px] truncate font-mono text-xs text-ink-dim">{t.entryPoi}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {LABELS.reaction[t.reactionQuality as keyof typeof LABELS.reaction]}
                    {t.noWick && <span className="ml-1.5 text-xs text-accent">no-wick</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-soft tabular">
                    {t.rrPlanned != null ? t.rrPlanned.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ResultBadge result={t.result} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RCell r={t.rRealized} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 opacity-0 transition group-hover:opacity-100">
                      <Link href={`/journal/${t.id}/edit`} className="text-ink-dim transition hover:text-accent" aria-label="Éditer">
                        <EditIcon className="h-4 w-4" />
                      </Link>
                      <DeleteButton id={t.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {trades.map((t) => (
          <div key={t.id} className="panel p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">{t.instrument}</span>
                <span className={`text-sm ${t.direction === "LONG" ? "text-win" : "text-loss"}`}>
                  {t.direction === "LONG" ? "Long" : "Short"}
                </span>
                <ResultBadge result={t.result} />
              </div>
              <RCell r={t.rRealized} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-dim">
              <span className="font-mono">{fmtDate(t.date)}</span>
              {t.session && <span>· {LABELS.session[t.session as keyof typeof LABELS.session]}</span>}
              {t.rrPlanned != null && <span>· RR {t.rrPlanned.toFixed(2)}</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="chip !px-2 !py-0.5">{LABELS.poiSize[t.poiSize as keyof typeof LABELS.poiSize]}</span>
              <span className="chip !px-2 !py-0.5">{LABELS.reaction[t.reactionQuality as keyof typeof LABELS.reaction]}</span>
              {t.noWick && <span className="chip !px-2 !py-0.5 !text-accent">no-wick</span>}
              {!t.followedPlan && <span className="chip !border-loss/40 !text-loss !px-2 !py-0.5">hors-plan</span>}
            </div>
            {t.entryPoi && (
              <div className="mt-2 font-mono text-xs text-ink-soft">
                {t.entryPoi} <span className="text-ink-dim">→</span> {t.targetZone}
              </div>
            )}
            <div className="mt-3 flex items-center justify-end gap-4 border-t border-border-soft pt-3">
              <Link href={`/journal/${t.id}/edit`} className="text-xs font-medium text-accent">
                Éditer
              </Link>
              <DeleteButton id={t.id} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
