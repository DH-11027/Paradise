import { parseCSV, toNum } from './dataUtils';

// =============================
// Investor mapping & parsing (KRX style, Korean headers)
// =============================
export const INVESTOR_KEYS = [
  "금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인","개인","외국인","기타외국인","기관합계"
];

export function normalizeInvestorRow(r) {
  const get = (k, alts=[]) => {
    const cand = [k, ...alts];
    for (const key of cand) {
      if (r[key] !== undefined) return toNum(r[key]);
    }
    return 0;
  };
  const out = {
    date: r.date || r.Date || r["날짜"],
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
  // If 기관합계 not provided or zero, compute from parts (excluding 개인/외국인 계열)
  if (!out.기관합계) {
    const parts = ["금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인"];
    out.기관합계 = parts.reduce((s,k)=>s+toNum(out[k]),0);
  }
  return out;
}

export function parseInvestorFlowCSV(text) {
  // 1) 일반 CSV/TSV 시도
  let raw = parseCSV(text);
  let parsed = raw
    .map(normalizeInvestorRow)
    .filter((r) => r.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // 2) 실패하면: 헤더에 탭/콤마가 없고 "여러 공백"이 있으면 공백->콤마 변환 후 재파싱
  if (parsed.length === 0) {
    const lines = text.trim().split(/\r?\n/);
    const head = lines[0] || "";
    const looksWS = !head.includes(",") && !head.includes("\t") && /\s{2,}/.test(head);
    if (looksWS) {
      const coerced = lines.map(ln => ln.trim().replace(/\s{2,}/g, ",")).join("\n");
      raw = parseCSV(coerced);
      parsed = raw
        .map(normalizeInvestorRow)
        .filter((r) => r.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  }
  return parsed;
}