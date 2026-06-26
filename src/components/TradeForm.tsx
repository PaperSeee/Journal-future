"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DIRECTIONS,
  INSTRUMENTS,
  LABELS,
  POI_SIZES,
  POI_TYPES,
  REACTIONS,
  RESULTS,
  SENTIMENTS,
  computeRrPlanned,
  defaultRealizedR,
  sessionFromTapTime,
  type Result,
} from "@/lib/domain";
import { createTrade, updateTrade, type ActionResult } from "@/app/actions";
import { compressImage } from "@/lib/image";
import { useToast } from "@/components/Toast";
import { Field, Segmented, Select, Toggle } from "@/components/form/Fields";

export interface TradeFormValues {
  id?: string;
  date: string; // yyyy-mm-dd
  instrument: string;
  direction: string;
  htfBias: string;
  entryPoiType: string;
  entryPoi: string;
  targetZone: string;
  tapTimeUtc: string;
  poiSize: string;
  reactionQuality: string;
  noWick: boolean;
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
  htfBias: "",
  entryPoiType: "IMBALANCE",
  entryPoi: "",
  targetZone: "",
  tapTimeUtc: "",
  poiSize: "MEDIUM",
  reactionQuality: "CLEAN",
  noWick: false,
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

  const set = <K extends keyof TradeFormValues>(k: K, val: TradeFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

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
    fd.set("htfBias", v.htfBias);
    fd.set("entryPoiType", v.entryPoiType);
    fd.set("entryPoi", v.entryPoi);
    fd.set("targetZone", v.targetZone);
    fd.set("tapTimeUtc", v.tapTimeUtc);
    fd.set("poiSize", v.poiSize);
    fd.set("reactionQuality", v.reactionQuality);
    fd.set("noWick", v.noWick ? "on" : "");
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
    <form onSubmit={onSubmit} className="space-y-5">
      {/* ── Contexte ── */}
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Contexte
        </h2>
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
          <Field label="Heure du tap (UTC)" htmlFor="tap" hint={session ? LABELS.session[session] : "HH:MM"} error={errors.tapTimeUtc}>
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

        <Field label="Biais HTF — le draw (où le prix veut livrer)" htmlFor="bias" error={errors.htfBias}>
          <input
            id="bias"
            className="input"
            placeholder="ex: livraison vers H4 sell-side 11700"
            value={v.htfBias}
            onChange={(e) => set("htfBias", e.target.value)}
          />
        </Field>
      </section>

      {/* ── Setup (2 zones) ── */}
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Setup — 2 zones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de POI d'entrée">
            <Select
              name="entryPoiType"
              value={v.entryPoiType}
              onChange={(e) => set("entryPoiType", e.target.value)}
              options={opts(POI_TYPES, LABELS.poiType)}
            />
          </Field>
          <Field label="Taille du POI">
            <Segmented
              name="poiSize"
              value={v.poiSize}
              onChange={(val) => set("poiSize", val)}
              options={POI_SIZES.map((s) => ({ value: s, label: LABELS.poiSize[s] }))}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="POI d'entrée" htmlFor="ein" error={errors.entryPoi}>
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
          <Toggle
            name="noWick"
            checked={v.noWick}
            onChange={(val) => set("noWick", val)}
            label="Bougie sans mèche"
            description="No-wick dans le sens du trade"
          />
        </div>
      </section>

      {/* ── Exécution ── */}
      <section className="panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
            Exécution
          </h2>
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

      {/* ── Discipline & psycho ── */}
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Discipline &amp; psychologie
        </h2>
        <Toggle
          name="followedPlan"
          checked={v.followedPlan}
          onChange={(val) => set("followedPlan", val)}
          label="Checklist respectée"
          description="Les 8 points étaient cochés"
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
      </section>

      <div className="sticky bottom-20 z-10 flex gap-3 md:bottom-4">
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
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
