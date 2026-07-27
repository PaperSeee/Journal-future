"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DIRECTIONS,
  INSTRUMENTS,
  LABELS,
  POI_SIZES,
  REACTIONS,
  RESULTS,
  SENTIMENTS,
  IB_SESSIONS,
  IB_FVGS,
  computeRrPlanned,
  defaultRealizedR,
  sessionFromTapTime,
  type Result,
} from "@/lib/domain";
import { createTrade, updateTrade, type ActionResult } from "@/app/actions";
import { compressImage } from "@/lib/image";
import { useToast } from "@/components/Toast";
import { Collapsible, Field, Segmented, Select, Toggle } from "@/components/form/Fields";

export interface TradeFormValues {
  id?: string;
  date: string; // yyyy-mm-dd
  instrument: string;
  direction: string;
  strategy: string;
  htfBias: string;
  entryPoiType: string;
  entryPoi: string;
  targetZone: string;
  tapTimeUtc: string;
  poiSize: string;
  reactionQuality: string;
  noWick: boolean;
  ibSession: string;
  ibDirection: string;
  ibEntryTiming: string;
  ibFvg: string;
  entryPrice: string;
  stopPrice: string;
  targetPrice: string;
  result: string;
  rRealized: string;
  followedPlan: boolean;
  sentimentPre: string;
  sentimentPost: string;
  note: string;
  screenshotUrl: string;
  tags: string;
}

const EMPTY: TradeFormValues = {
  date: new Date().toISOString().slice(0, 10),
  instrument: "MNQ",
  direction: "LONG",
  strategy: "HTF_IMBALANCE",
  htfBias: "",
  entryPoiType: "IMBALANCE",
  entryPoi: "",
  targetZone: "",
  tapTimeUtc: "",
  poiSize: "MEDIUM",
  reactionQuality: "CLEAN",
  noWick: false,
  ibSession: "LONDON",
  ibDirection: "BULLISH",
  ibEntryTiming: "AFTER_IB_CLOSE",
  ibFvg: "M5",
  entryPrice: "",
  stopPrice: "",
  targetPrice: "",
  result: "WIN",
  rRealized: "",
  followedPlan: true,
  sentimentPre: "",
  sentimentPost: "",
  note: "",
  screenshotUrl: "",
  tags: "",
};

// Context fields worth remembering between two trades logged back-to-back
// (same daily bias / same imbalance family) — the biggest source of repetitive typing.
const CONTEXT_KEYS = [
  "strategy",
  "htfBias",
  "entryPoiType",
  "entryPoi",
  "targetZone",
  "poiSize",
  "reactionQuality",
  "noWick",
  "ibSession",
  "ibDirection",
  "ibEntryTiming",
  "ibFvg",
] as const;
const LAST_CONTEXT_KEY = "mercure:lastTradeContext";

function saveLastContext(v: TradeFormValues) {
  try {
    const ctx: Record<string, unknown> = {};
    for (const k of CONTEXT_KEYS) ctx[k] = v[k];
    localStorage.setItem(LAST_CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

function loadLastContext(): Partial<TradeFormValues> | null {
  try {
    const raw = localStorage.getItem(LAST_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as Partial<TradeFormValues>) : null;
  } catch {
    return null;
  }
}

const opts = <T extends string>(arr: readonly T[], labels: Record<T, string>) =>
  arr.map((v) => ({ value: v, label: labels[v] }));

export function TradeForm({
  initial,
  mode,
}: {
  initial?: Partial<TradeFormValues>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState<TradeFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [hasLastContext, setHasLastContext] = useState(false);

  useEffect(() => {
    if (mode === "create") setHasLastContext(loadLastContext() != null);
  }, [mode]);

  // Keyboard shortcut: Cmd/Ctrl+Enter submits from anywhere in the form.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        document.getElementById("trade-form-submit")?.click();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const set = <K extends keyof TradeFormValues>(k: K, val: TradeFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  function applyLastContext() {
    const ctx = loadLastContext();
    if (!ctx) return;
    setV((prev) => ({ ...prev, ...ctx }));
    toast.push("Contexte du dernier trade réappliqué", "info");
  }

  // Live planned RR.
  const rrPlanned = useMemo(
    () =>
      computeRrPlanned(
        v.entryPrice ? Number(v.entryPrice) : null,
        v.stopPrice ? Number(v.stopPrice) : null,
        v.targetPrice ? Number(v.targetPrice) : null,
      ),
    [v.entryPrice, v.stopPrice, v.targetPrice],
  );

  const session = sessionFromTapTime(v.tapTimeUtc);
  const isIb = v.strategy === "IB";

  // When result changes, prefill realized R per the rules (LOSS → -1, BE → 0).
  function onResultChange(result: string) {
    const def = defaultRealizedR(result as Result);
    setV((prev) => ({
      ...prev,
      result,
      rRealized:
        result === "WIN"
          ? prev.rRealized === "-1" || prev.rRealized === "0"
            ? rrPlanned != null
              ? String(rrPlanned)
              : ""
            : prev.rRealized
          : def != null
          ? String(def)
          : prev.rRealized,
    }));
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      set("screenshotUrl", compressed);
      toast.push("Capture ajoutée", "success");
    } catch {
      toast.push("Échec de la compression de l'image", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("date", v.date);
    fd.set("instrument", v.instrument);
    fd.set("direction", v.direction);
    fd.set("strategy", v.strategy);
    const isIb = v.strategy === "IB";
    // On n'envoie les champs d'une stratégie que si elle est active (les autres → vides).
    fd.set("htfBias", isIb ? "" : v.htfBias);
    fd.set("entryPoiType", isIb ? "" : v.entryPoiType);
    fd.set("entryPoi", isIb ? "" : v.entryPoi);
    fd.set("targetZone", isIb ? "" : v.targetZone);
    fd.set("tapTimeUtc", v.tapTimeUtc);
    fd.set("poiSize", isIb ? "" : v.poiSize);
    fd.set("reactionQuality", isIb ? "" : v.reactionQuality);
    fd.set("noWick", v.noWick ? "on" : "");
    fd.set("ibSession", isIb ? v.ibSession : "");
    fd.set("ibDirection", isIb ? v.ibDirection : "");
    fd.set("ibEntryTiming", isIb ? v.ibEntryTiming : "");
    fd.set("ibFvg", isIb ? v.ibFvg : "");
    fd.set("entryPrice", v.entryPrice);
    fd.set("stopPrice", v.stopPrice);
    fd.set("targetPrice", v.targetPrice);
    fd.set("result", v.result);
    fd.set("rRealized", v.rRealized);
    fd.set("followedPlan", v.followedPlan ? "on" : "");
    fd.set("sentimentPre", v.sentimentPre);
    fd.set("sentimentPost", v.sentimentPost);
    fd.set("note", v.note);
    fd.set("screenshotUrl", v.screenshotUrl);
    fd.set("tags", v.tags);
    return fd;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const fd = buildFormData();
    startTransition(async () => {
      let res: ActionResult;
      if (mode === "edit" && initial?.id) {
        res = await updateTrade(initial.id, fd);
      } else {
        res = await createTrade(fd);
      }
      if (res.ok) {
        saveLastContext(v);
        toast.push(
          mode === "edit" ? "Trade mis à jour" : "Trade enregistré",
          "success",
        );
        router.push("/journal");
        router.refresh();
      } else if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        toast.push("Vérifie les champs en rouge", "error");
      } else {
        toast.push(res.error ?? "Erreur", "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── Essentiel — encodage rapide ── */}
      <section className="panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
            Essentiel
          </h2>
          <span className="hidden text-[11px] text-ink-dim sm:inline">⌘/Ctrl + Entrée pour enregistrer</span>
        </div>

        <Field label="Stratégie" hint="pilote les champs de contexte">
          <Segmented
            name="strategy"
            value={v.strategy}
            onChange={(val) => set("strategy", val)}
            options={[
              { value: "HTF_IMBALANCE", label: "HTF — Imbalances" },
              { value: "IB", label: "IB — Initial Balance" },
            ]}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="date" error={errors.date}>
            <input
              id="date"
              type="date"
              className="input"
              value={v.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Heure du tap (UTC+2)" htmlFor="tap" hint={session ? LABELS.session[session] : "HH:MM"} error={errors.tapTimeUtc}>
            <input
              id="tap"
              type="text"
              inputMode="numeric"
              placeholder="14:30"
              className="input"
              value={v.tapTimeUtc}
              onChange={(e) => set("tapTimeUtc", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instrument">
            <Select
              name="instrument"
              value={v.instrument}
              onChange={(e) => set("instrument", e.target.value)}
              options={opts(INSTRUMENTS, LABELS.instrument)}
            />
          </Field>
          <Field label="Direction">
            <Segmented
              name="direction"
              value={v.direction}
              onChange={(val) => set("direction", val)}
              options={[
                { value: "LONG", label: "Long", tone: "win" },
                { value: "SHORT", label: "Short", tone: "loss" },
              ]}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Résultat">
            <Segmented
              name="result"
              value={v.result}
              onChange={onResultChange}
              options={[
                { value: "WIN", label: "Win", tone: "win" },
                { value: "LOSS", label: "Loss", tone: "loss" },
                { value: "BE", label: "BE", tone: "be" },
              ]}
            />
          </Field>
          <Field label="R réalisé (signé)" htmlFor="r" hint="source de vérité des stats" error={errors.rRealized}>
            <input
              id="r"
              type="number"
              step="any"
              className="input font-mono"
              placeholder="+2.5 / -1 / 0"
              value={v.rRealized}
              onChange={(e) => set("rRealized", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* ── Contexte & setup — 2 zones + prix ── */}
      <Collapsible
        title="Contexte & setup"
        action={
          mode === "create" && hasLastContext ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                applyLastContext();
              }}
              className="text-xs font-medium text-accent hover:underline"
            >
              Reprendre le dernier contexte
            </button>
          ) : undefined
        }
      >
        {/* ── Champs HTF (modèle 2-imbalances) ── */}
        {!isIb && (
          <>
            <Field label="Biais HTF — le draw (où le prix veut livrer)" htmlFor="bias" error={errors.htfBias}>
              <input
                id="bias"
                className="input"
                placeholder="ex: livraison vers H4 sell-side 11700"
                value={v.htfBias}
                onChange={(e) => set("htfBias", e.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Imbalance d'entrée" htmlFor="ein" error={errors.entryPoi}>
                <input
                  id="ein"
                  className="input"
                  placeholder="H1 11835-11858"
                  value={v.entryPoi}
                  onChange={(e) => set("entryPoi", e.target.value)}
                />
              </Field>
              <Field label="Zone cible (opposée)" htmlFor="cib" error={errors.targetZone}>
                <input
                  id="cib"
                  className="input"
                  placeholder="H4 11700-11720"
                  value={v.targetZone}
                  onChange={(e) => set("targetZone", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Taille de l'imbalance">
                <Segmented
                  name="poiSize"
                  value={v.poiSize}
                  onChange={(val) => set("poiSize", val)}
                  options={POI_SIZES.map((s) => ({ value: s, label: LABELS.poiSize[s] }))}
                />
              </Field>
              <Field label="Qualité de la réaction">
                <Segmented
                  name="reactionQuality"
                  value={v.reactionQuality}
                  onChange={(val) => set("reactionQuality", val)}
                  options={[
                    { value: "CLEAN", label: "Clean", tone: "win" },
                    { value: "WEAK", label: "Faible", tone: "be" },
                    { value: "FORCED", label: "Forcée", tone: "loss" },
                  ]}
                />
              </Field>
            </div>
            <Toggle
              name="noWick"
              checked={v.noWick}
              onChange={(val) => set("noWick", val)}
              label="Bougie sans mèche"
              description="No-wick dans le sens du trade"
            />
          </>
        )}

        {/* ── Champs IB (Initial Balance) ── */}
        {isIb && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Session IB" error={errors.ibSession}>
                <Segmented
                  name="ibSession"
                  value={v.ibSession}
                  onChange={(val) => set("ibSession", val)}
                  options={IB_SESSIONS.map((s) => ({ value: s, label: LABELS.ibSession[s] }))}
                />
              </Field>
              <Field label="Biais de l'IB" error={errors.ibDirection}>
                <Segmented
                  name="ibDirection"
                  value={v.ibDirection}
                  onChange={(val) => set("ibDirection", val)}
                  options={[
                    { value: "BULLISH", label: "Haussier", tone: "win" },
                    { value: "BEARISH", label: "Baissier", tone: "loss" },
                  ]}
                />
              </Field>
            </div>
            <Field label="Timing d'entrée" error={errors.ibEntryTiming}>
              <Segmented
                name="ibEntryTiming"
                value={v.ibEntryTiming}
                onChange={(val) => set("ibEntryTiming", val)}
                options={[
                  { value: "BEFORE_IB_CLOSE", label: "Avant la fin de l'IB" },
                  { value: "AFTER_IB_CLOSE", label: "Après clôture de l'IB" },
                ]}
              />
            </Field>
            <Field label="Entrée sur FVG" hint="au cas par cas">
              <Segmented
                name="ibFvg"
                value={v.ibFvg}
                onChange={(val) => set("ibFvg", val)}
                options={IB_FVGS.map((f) => ({ value: f, label: LABELS.ibFvg[f] }))}
              />
            </Field>
          </>
        )}

        <div className="border-t border-border-soft pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label">Exécution (prix)</span>
            <div className="chip">
              RR planifié
              <span className="font-mono font-semibold text-accent">
                {rrPlanned != null ? `${rrPlanned.toFixed(2)}` : "—"}
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Entrée" htmlFor="entry">
              <input id="entry" type="number" step="any" className="input font-mono" value={v.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
            </Field>
            <Field label="Stop" htmlFor="stop">
              <input id="stop" type="number" step="any" className="input font-mono" value={v.stopPrice} onChange={(e) => set("stopPrice", e.target.value)} />
            </Field>
            <Field label="Cible" htmlFor="tgt">
              <input id="tgt" type="number" step="any" className="input font-mono" value={v.targetPrice} onChange={(e) => set("targetPrice", e.target.value)} />
            </Field>
          </div>
        </div>
      </Collapsible>

      {/* ── Discipline & psycho — repliée par défaut, pas indispensable à chaque trade ── */}
      <Collapsible title="Discipline & psychologie" defaultOpen={false}>
        <Toggle
          name="followedPlan"
          checked={v.followedPlan}
          onChange={(val) => set("followedPlan", val)}
          label="Checklist respectée"
          description="Les points étaient cochés"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sentiment AVANT">
            <Select
              name="sentimentPre"
              value={v.sentimentPre}
              onChange={(e) => set("sentimentPre", e.target.value)}
              options={[{ value: "", label: "—" }, ...opts(SENTIMENTS, LABELS.sentiment)]}
            />
          </Field>
          <Field label="Sentiment APRÈS">
            <Select
              name="sentimentPost"
              value={v.sentimentPost}
              onChange={(e) => set("sentimentPost", e.target.value)}
              options={[{ value: "", label: "—" }, ...opts(SENTIMENTS, LABELS.sentiment)]}
            />
          </Field>
        </div>
        <Field label="Tags" htmlFor="tags" hint="séparés par des virgules">
          <input
            id="tags"
            className="input"
            placeholder="A+, overnight, raffiné"
            value={v.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </Field>
        <Field label="Note" htmlFor="note">
          <textarea
            id="note"
            rows={3}
            className="input resize-y"
            placeholder="Contexte, exécution, leçon…"
            value={v.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>

        <Field label="Capture d'écran">
          <div className="flex items-center gap-3">
            <label className="btn-ghost cursor-pointer">
              {uploading ? "Compression…" : v.screenshotUrl ? "Remplacer" : "Ajouter une image"}
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>
            {v.screenshotUrl && (
              <button type="button" className="text-xs text-loss hover:underline" onClick={() => set("screenshotUrl", "")}>
                Retirer
              </button>
            )}
          </div>
          {v.screenshotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.screenshotUrl}
              alt="capture du trade"
              className="mt-3 max-h-64 w-full rounded-lg border border-border object-contain"
            />
          )}
        </Field>
      </Collapsible>

      <div className="sticky bottom-20 z-10 flex gap-3 md:bottom-4">
        <button id="trade-form-submit" type="submit" className="btn-primary flex-1" disabled={pending}>
          {pending ? "Enregistrement…" : mode === "edit" ? "Mettre à jour" : "Enregistrer le trade"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
