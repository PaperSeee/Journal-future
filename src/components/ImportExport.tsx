"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTrades } from "@/app/actions";
import { useToast } from "@/components/Toast";
import {
  downloadFile,
  timestampedName,
  tradesToCsv,
  tradesToJson,
  type ExportTrade,
} from "@/lib/export";

export function ImportExport({ trades }: { trades: ExportTrade[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function exportJson() {
    downloadFile(timestampedName("hqgambler", "json"), tradesToJson(trades), "application/json");
    toast.push("Export JSON téléchargé", "success");
  }
  function exportCsv() {
    downloadFile(timestampedName("hqgambler", "csv"), tradesToCsv(trades), "text/csv");
    toast.push("Export CSV téléchargé", "success");
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    e.target.value = "";
    startTransition(async () => {
      const res = await importTrades(text);
      if (res.ok) {
        toast.push(`${res.imported} trade(s) importé(s)`, "success");
        setOpen(false);
        router.refresh();
      } else {
        toast.push(res.error ?? "Import échoué", "error");
      }
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost">
        <ExchangeIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Import / Export</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-60 animate-fade-in rounded-xl border border-border bg-panel p-2 shadow-card">
            <button onClick={exportJson} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition hover:bg-panel-hover hover:text-ink">
              <DownloadIcon className="h-4 w-4" /> Exporter en JSON
            </button>
            <button onClick={exportCsv} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition hover:bg-panel-hover hover:text-ink">
              <DownloadIcon className="h-4 w-4" /> Exporter en CSV
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition hover:bg-panel-hover hover:text-ink"
            >
              <UploadIcon className="h-4 w-4" />
              {pending ? "Import en cours…" : "Importer (JSON)"}
            </button>
            <p className="px-3 py-1.5 text-[11px] text-ink-dim">
              Accepte l&apos;export HqGambler et l&apos;ancien format localStorage.
            </p>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
    </div>
  );
}

function ExchangeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
