"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  TILT_TRIGGERS,
  TRIGGER_BY_ID,
  INTENSITY_META,
  coachingInsight,
  type TiltIntensity,
} from "@/lib/tilt";

// ── Modèle & persistance (localStorage — pas de base de données) ──
type TiltEntry = {
  id: string;
  date: string; // ISO
  triggerId: string;
  intensity: TiltIntensity;
  note: string;
  actedOnIt: boolean; // le tilt a-t-il déclenché une action (trade hors plan) ?
};

const STORAGE_KEY = "mercure.tilt.entries.v1";

function loadEntries(): TiltEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TiltEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: TiltEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / mode privé — on ignore */
  }
}

function toneClass(tone: "warn" | "loss" | "critical") {
  switch (tone) {
    case "warn":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "loss":
      return "border-loss/40 bg-loss/10 text-loss";
    case "critical":
      return "border-red-500/50 bg-red-500/15 text-red-300";
  }
}

export function TiltJournal() {
  const toast = useToast();
  const [entries, setEntries] = useState<TiltEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Champs du formulaire
  const [triggerId, setTriggerId] = useState<string>(TILT_TRIGGERS[0]?.id ?? "");
  const [intensity, setIntensity] = useState<TiltIntensity>(2);
  const [note, setNote] = useState("");
  const [actedOnIt, setActedOnIt] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHydrated(true);
  }, []);

  const selectedTrigger = TRIGGER_BY_ID[triggerId];

  const insight = useMemo(
    () =>
      coachingInsight(
        entries.map((e) => ({ triggerId: e.triggerId, intensity: e.intensity, date: e.date })),
      ),
    [entries],
  );

  // Stats rapides
  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600_000;
    const week = entries.filter((e) => new Date(e.date).getTime() >= weekAgo);
    const acted = entries.filter((e) => e.actedOnIt).length;
    const caught = entries.length - acted;
    return { total: entries.length, week: week.length, acted, caught };
  }, [entries]);

  function addEntry() {
    const entry: TiltEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      triggerId,
      intensity,
      note: note.trim(),
      actedOnIt,
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
    setNote("");
    setActedOnIt(false);
    toast.push("Tilt noté — respire, relis ton plan.", "info");
  }

  function removeEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  return (
    <div className="space-y-6">
      {/* Coaching en direct */}
      <section className="panel relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Conseil du coach
        </h2>
        <p className="mt-3 font-display text-lg font-semibold text-ink">{insight.headline}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{insight.body}</p>

        {hydrated && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Tilts notés" value={stats.total} />
            <Stat label="7 derniers jours" value={stats.week} />
            <Stat label="Repérés à temps" value={stats.caught} tone="win" />
            <Stat label="Ont coûté" value={stats.acted} tone="loss" />
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulaire de saisie */}
        <section className="panel p-5 sm:p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
            Noter un tilt
          </h2>
          <p className="mt-1 text-xs text-ink-dim">
            À chaud, sans te juger. Écrire le tilt, c&apos;est déjà casser la spirale.
          </p>

          {/* Déclencheur */}
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Déclencheur
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TILT_TRIGGERS.map((t) => {
              const active = t.id === triggerId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTriggerId(t.id)}
                  className={[
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-panel-soft text-ink-soft hover:border-border-soft hover:text-ink",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Explication du déclencheur choisi */}
          {selectedTrigger && (
            <div className="mt-3 rounded-md border border-border-soft bg-panel-soft p-3">
              <p className="text-xs leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Le tell —</span> {selectedTrigger.tell}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-accent">
                <span className="font-semibold">Antidote —</span> {selectedTrigger.antidote}
              </p>
            </div>
          )}

          {/* Intensité */}
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Intensité
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([1, 2, 3] as TiltIntensity[]).map((lvl) => {
              const meta = INTENSITY_META[lvl];
              const active = intensity === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setIntensity(lvl)}
                  className={[
                    "rounded-md border px-3 py-2 text-left transition",
                    active ? toneClass(meta.tone) : "border-border bg-panel-soft text-ink-soft hover:text-ink",
                  ].join(" ")}
                >
                  <div className="text-xs font-semibold">{meta.label}</div>
                  <div className="mt-0.5 text-[10px] leading-tight opacity-80">{meta.hint}</div>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Ce qui s&apos;est passé <span className="text-ink-dim">(optionnel)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Ex : après un SL sur MNQ j'ai voulu rentrer direct pour récupérer…"
            className="mt-2 w-full resize-y rounded-md border border-border bg-panel-soft px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-accent focus:outline-none"
          />

          {/* A coûté ? */}
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={actedOnIt}
              onChange={(e) => setActedOnIt(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-panel-soft accent-loss"
            />
            J&apos;ai agi dessus (trade hors plan, stop bougé, sur-taille…)
          </label>

          <button
            type="button"
            onClick={addEntry}
            className="mt-5 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Noter ce tilt
          </button>
        </section>

        {/* Protocole de reprise en main */}
        <section className="panel p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-loss">
            <ResetIcon className="h-4 w-4" />
            Protocole reset — maintenant
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              { step: "Stop immédiat", detail: "Mains OFF le clavier. Aucun ordre pendant 15 minutes." },
              { step: "Nomme l'émotion", detail: "Écris-la ci-contre. Nommer = reprendre le contrôle." },
              { step: "Relis ton Plan", detail: "Le prochain trade coche-t-il TOUS les non-négociables ?" },
              { step: "Continuer ou couper", detail: "Plafond de pertes atteint ? La session est finie. Sans négocier." },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-loss/15 font-mono text-xs font-semibold text-loss">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{s.step}</div>
                  <div className="text-xs text-ink-dim">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-md border border-border-soft bg-panel-soft p-3 text-xs italic leading-relaxed text-ink-soft">
            « Une perte au stop planifié est un bon trade. Le seul mauvais trade, c&apos;est celui que
            l&apos;émotion a pris à la place du plan. »
          </p>
        </section>
      </div>

      {/* Historique */}
      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
          Historique
        </h2>
        {!hydrated ? (
          <p className="mt-3 text-sm text-ink-dim">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="mt-3 text-sm text-ink-dim">
            Aucun tilt noté pour l&apos;instant. Note-les même « légers » — c&apos;est comme ça qu&apos;on
            voit les schémas se dessiner.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border-soft">
            {entries.map((e) => {
              const t = TRIGGER_BY_ID[e.triggerId];
              const meta = INTENSITY_META[e.intensity];
              return (
                <li key={e.id} className="flex items-start gap-3 py-3">
                  <span
                    className={[
                      "mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      toneClass(meta.tone),
                    ].join(" ")}
                  >
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-ink">{t?.label ?? e.triggerId}</span>
                      {e.actedOnIt && (
                        <span className="rounded bg-loss/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-loss">
                          a coûté
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-ink-dim">
                        {new Date(e.date).toLocaleString("fr-BE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {e.note && <p className="mt-1 text-sm text-ink-soft">{e.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(e.id)}
                    aria-label="Supprimer"
                    className="shrink-0 rounded p-1 text-ink-dim transition hover:bg-panel-hover hover:text-loss"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "win" | "loss";
}) {
  const color = tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "text-ink";
  return (
    <div className="panel-soft p-3">
      <div className={["font-display text-2xl font-semibold tabular", color].join(" ")}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-dim">{label}</div>
    </div>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
