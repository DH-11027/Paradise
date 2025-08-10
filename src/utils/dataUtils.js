// =============================
// Data parsing and formatting utilities
// =============================

export function parseCSV(text) {
  // Minimal CSV parser (comma or tab). Expects header row.
  // Remove all possible BOM variants
  let cleanText = text;
  
  // Remove various BOM encodings
  cleanText = cleanText.replace(/^\uFEFF/, ''); // UTF-16 BOM
  cleanText = cleanText.replace(/^\xEF\xBB\xBF/, ''); // UTF-8 BOM as hex
  cleanText = cleanText.replace(/^﻿/, ''); // UTF-8 BOM as character
  
  // Remove BOM if it appears as actual character codes
  if (cleanText.charCodeAt(0) === 0xFEFF || cleanText.charCodeAt(0) === 65279) {
    cleanText = cleanText.substring(1);
  }
  
  cleanText = cleanText.trim();
  
  console.log('CSV parsing - first 100 chars:', cleanText.substring(0, 100));
  
  const lines = cleanText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    console.log('CSV parsing failed: not enough lines', lines.length);
    return [];
  }
  
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map((h) => {
    // Clean each header
    let cleaned = h.trim();
    cleaned = cleaned.replace(/^[\uFEFF\xEF\xBB\xBF]/, '');
    cleaned = cleaned.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
    return cleaned;
  });
  
  console.log('CSV headers detected:', headers);
  
  const data = lines.slice(1).map((line, idx) => {
    const cols = line.split(sep);
    const row = {};
    headers.forEach((h, i) => {
      let value = cols[i]?.trim?.() ?? "";
      value = value.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
      row[h] = value;
    });
    if (idx < 2) console.log(`CSV row ${idx}:`, row);
    return row;
  });
  
  console.log(`CSV parsed ${data.length} rows`);
  return data;
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
  
  // 문자열인 경우 다양한 형식 처리
  if (typeof d === 'string') {
    // T가 포함된 ISO 형식이면 날짜 부분만 추출
    if (d.includes('T')) {
      return d.split('T')[0];
    }
    
    // YYYY-MM-DD 또는 YYYY/MM/DD 형식 처리
    const cleaned = d.trim().replace(/\//g, '-');
    
    // YYYY-M-D 형식을 YYYY-MM-DD로 변환
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Date 객체로 파싱 시도
  try {
    const t = new Date(d);
    if (!Number.isNaN(t.getTime())) {
      return t.toISOString().slice(0, 10);
    }
  } catch (e) {
    // 파싱 실패
  }
  
  return String(d); // keep original if invalid
}