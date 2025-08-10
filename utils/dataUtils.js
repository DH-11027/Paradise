// =============================
// Data parsing and formatting utilities
// =============================

export function parseCSV(text) {
  // Minimal CSV parser (comma or tab). Expects header row.
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(sep);
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i]?.trim?.() ?? ""));
    return row;
  });
}

export function toNum(v) {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (s === "" || s === "-") return 0;
  // Remove commas and KR units; support scientific notation (e.g., -1.1E+09)
  const clean = s.replace(/,/g, "").replace(/원|주|%/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export function fmtDate(d) {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return String(d); // keep original if invalid
  return t.toISOString().slice(0, 10);
}