import { toNum, fmtDate } from './dataUtils';

// Compute Indicators: OBV, MFI(14), ATR(14), Anchored VWAP
export function computeIndicators(rows, anchorIndex) {
  if (!rows || rows.length === 0) return { data: [], obvMax: 0 };
  const data = rows.map((r) => ({ ...r }));
  let obv = 0;
  let prevClose = null;
  let prevTp = null;
  const posMF = Array(data.length).fill(0);
  const negMF = Array(data.length).fill(0);
  const trArr = Array(data.length).fill(0);

  for (let i = 0; i < data.length; i++) {
    const h = toNum(data[i].high);
    const l = toNum(data[i].low);
    const c = toNum(data[i].close);
    const v = toNum(data[i].volume);

    // OBV
    if (prevClose !== null) {
      if (c > prevClose) obv += v;
      else if (c < prevClose) obv -= v;
    }
    data[i].obv = obv;

    // Typical price & money flow (MFI)
    const tp = (h + l + c) / 3;
    if (prevTp !== null) {
      const mf = tp * v;
      if (tp > prevTp) posMF[i] = mf; else if (tp < prevTp) negMF[i] = mf;
    }
    data[i].tp = tp;

    // True Range (for ATR)
    if (prevClose !== null) {
      const tr = Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose));
      trArr[i] = tr;
    } else {
      trArr[i] = h - l;
    }

    prevClose = c;
    prevTp = tp;
  }

  // Rolling ATR (SMA 14)
  const period = 14;
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      data[i].atr14 = null;
    } else {
      let sum = 0;
      for (let k = i - period + 1; k <= i; k++) sum += trArr[k];
      data[i].atr14 = sum / period;
    }
  }

  // Rolling MFI(14)
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      data[i].mfi14 = null;
    } else {
      let pos = 0, neg = 0;
      for (let k = i - period + 1; k <= i; k++) { pos += posMF[k]; neg += negMF[k]; }
      const mr = neg === 0 ? 100 : pos / neg;
      data[i].mfi14 = 100 - 100 / (1 + mr);
    }
  }

  // Anchored VWAP from selected anchorIndex (default = first index)
  const start = Math.max(0, Math.min(anchorIndex ?? 0, data.length - 1));
  let cumPV = 0, cumV = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < start) { data[i].avwap = null; continue; }
    const v = toNum(data[i].volume);
    const p = data[i].tp;
    cumPV += p * v;
    cumV += v;
    data[i].avwap = cumV ? cumPV / cumV : null;
  }

  const obvMax = Math.max(...data.map((d) => Math.abs(d.obv || 0)));
  return { data, obvMax };
}

export function mergeInvestorFlows(priceRows, flowRows) {
  if (!flowRows || flowRows.length === 0) return priceRows;
  const byDate = new Map(flowRows.map((r) => [fmtDate(r.date || r.Date || r["날짜"]), r]));

  // Prepare cumulative map for detailed categories
  const cats = [
    "금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인","개인","외국인","기타외국인","기관합계","외국인합계"
  ];
  const cumMap = Object.fromEntries(cats.map((k) => [k, 0]));

  let cumF = 0, cumI = 0, cumP = 0;

  return priceRows.map((p) => {
    const key = fmtDate(p.date || p.Date || p["날짜"]);
    const fr = byDate.get(key) || {};

    // Compose details
    const details = {
      금융투자: toNum(fr["금융투자"]) || 0,
      보험: toNum(fr["보험"]) || 0,
      투신: toNum(fr["투신"]) || 0,
      사모: toNum(fr["사모"]) || 0,
      은행: toNum(fr["은행"]) || 0,
      기타금융: toNum(fr["기타금융"]) || 0,
      연기금: toNum(fr["연기금"]) || 0,
      기타법인: toNum(fr["기타법인"]) || 0,
      개인: toNum(fr["개인"]) || 0,
      외국인: toNum(fr["외국인"]) || 0,
      기타외국인: toNum(fr["기타외국인"]) || 0,
      기관합계: toNum(fr["기관합계"]) || 0,
    };
    if (!details.기관합계) {
      details.기관합계 = ["금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인"].reduce((s,k)=>s+toNum(details[k]),0);
    }
    details["외국인합계"] = details.외국인 + details.기타외국인;

    // For backward-compatibility (existing charts): foreign/institution totals
    const f = toNum(fr.foreign ?? details["외국인합계"]) || 0;
    const i = toNum(fr.institution ?? details["기관합계"]) || 0;
    const person = details.개인 || 0;

    cumF += f; cumI += i; cumP += person;
    cats.forEach((k) => (cumMap[k] += toNum(details[k] || 0)));

    return {
      ...p,
      foreign: f,
      inst: i,
      person,
      cumForeign: cumF,
      cumInst: cumI,
      cumPerson: cumP,
      _flows: details,
      _cum: { ...cumMap },
    };
  });
}