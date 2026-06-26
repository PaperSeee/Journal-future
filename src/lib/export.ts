// Export helpers — used client-side to download JSON / CSV.

const CSV_COLUMNS = [
  "date",
  "instrument",
  "direction",
  "htfBias",
  "entryPoiType",
  "entryPoi",
  "targetZone",
  "tapTimeUtc",
  "session",
  "poiSize",
  "reactionQuality",
  "noWick",
  "entryPrice",
  "stopPrice",
  "targetPrice",
  "rrPlanned",
  "result",
  "rRealized",
  "followedPlan",
  "sentimentPre",
  "sentimentPost",
  "note",
  "tags",
] as const;

export type ExportTrade = Record<string, unknown>;

function csvEscape(value: unknown): string {
  if (value == null) return "";
  let s: string;
  if (Array.isArray(value)) s = value.join("|");
  else if (value instanceof Date) s = value.toISOString();
  else s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function tradesToCsv(trades: ExportTrade[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = trades.map((t) =>
    CSV_COLUMNS.map((c) => csvEscape(t[c])).join(","),
  );
  return [header, ...rows].join("\n");
}

export function tradesToJson(trades: ExportTrade[]): string {
  return JSON.stringify(trades, null, 2);
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function timestampedName(prefix: string, ext: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${prefix}-${d}.${ext}`;
}
