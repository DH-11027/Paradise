import { parseCSV, toNum } from './dataUtils';

// =============================
// Investor mapping & parsing (KRX style, Korean headers)
// =============================
export const INVESTOR_KEYS = [
  "금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인","개인","외국인","기타외국인","기관합계"
];

export function normalizeInvestorRow(r) {
  console.log('Normalizing row:', Object.keys(r).slice(0, 5));
  
  const get = (k, alts=[]) => {
    const cand = [k, ...alts];
    for (const key of cand) {
      if (r[key] !== undefined) {
        const value = toNum(r[key]);
        if (value !== 0 && k === "금융투자") {
          console.log(`Found 금융투자: ${value}`);
        }
        return value;
      }
    }
    return 0;
  };
  // 날짜 찾기 - 다양한 형식 지원
  let dateValue = r.date || r.Date || r["날짜"] || r["﻿날짜"] || Object.values(r)[0];
  console.log('Date value found:', dateValue);
  
  const out = {
    date: dateValue,
    금융투자: get("금융투자", ["Securities","FinancialInvestment"]),
    보험: get("보험", ["Insurance"]),
    투신: get("투신", ["InvestmentTrust"]),
    사모: get("사모", ["PrivateEquity","사모펀드"]),
    은행: get("은행", ["Bank"]),
    기타금융: get("기타금융", ["OtherFinance"]),
    연기금: get("연기금", ["Pension"]),
    기타법인: get("기타법인", ["OtherCorporation"]),
    개인: get("개인", ["Individual"]),
    외국인: get("외국인", ["Foreigner","Foreign"]),
    기타외국인: get("기타외국인", ["OtherForeigner"]),
    기관합계: get("기관합계", ["기관", "InstitutionTotal"]),
  };
  
  console.log('Normalized row output:', { date: out.date, 금융투자: out.금융투자, 개인: out.개인 });
  // If 기관합계 not provided or zero, compute from parts (excluding 개인/외국인 계열)
  if (!out.기관합계) {
    const parts = ["금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인"];
    out.기관합계 = parts.reduce((s,k)=>s+toNum(out[k]),0);
  }
  return out;
}

export function parseInvestorFlowCSV(text) {
  console.log('parseInvestorFlowCSV called, text length:', text?.length);
  console.log('First 200 chars of text:', text?.substring(0, 200));
  
  // 1) 일반 CSV/TSV 시도
  let raw = parseCSV(text);
  console.log('Raw CSV parsed, rows:', raw.length);
  if (raw.length > 0) {
    console.log('First raw row:', raw[0]);
  }
  
  let parsed = raw
    .map(normalizeInvestorRow)
    .filter((r) => r.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  console.log('After normalize and filter, rows:', parsed.length);
  if (parsed.length > 0) {
    console.log('First parsed row:', parsed[0]);
  }

  // 2) 실패하면: 헤더에 탭/콤마가 없고 공백이 있으면 공백 기준 파싱
  if (parsed.length === 0) {
    const lines = text.trim().split(/\r?\n/);
    const head = lines[0] || "";
    const looksWS = !head.includes(",") && !head.includes("\t") && /\s+/.test(head);
    if (looksWS) {
      // 공백으로 구분된 데이터를 직접 파싱
      const headers = head.trim().split(/\s+/);
      const rows = lines.slice(1).map(line => {
        const values = line.trim().split(/\s+/);
        const row = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });
      parsed = rows
        .map(normalizeInvestorRow)
        .filter((r) => r.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }
  return parsed;
}