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

// 주식수 단위인지 판단 (값이 너무 작으면 주식수로 간주)
function detectVolumeUnit(flowRows) {
  if (!flowRows || flowRows.length === 0) return false;
  
  // 첫 번째 데이터의 값들을 확인
  const firstRow = flowRows[0];
  const numericKeys = ["금융투자", "보험", "투신", "사모", "은행", "기타금융", "연기금", "기타법인", "개인", "외국인", "기타외국인"];
  const values = numericKeys.map(k => toNum(firstRow[k])).filter(v => v !== 0);
  
  if (values.length === 0) return false;
  
  const maxAbsValue = Math.max(...values.map(Math.abs));
  
  // 최대 절대값이 1,000,000 미만이면 주식수 단위로 판단
  const isVolume = maxAbsValue < 1000000;
  return isVolume;
}

export function mergeInvestorFlows(priceRows, flowRows) {
  console.log('mergeInvestorFlows called');
  console.log('- priceRows:', priceRows?.length);
  console.log('- flowRows:', flowRows?.length);
  
  if (!flowRows || flowRows.length === 0) {
    console.log('No flow rows, returning price rows only');
    return priceRows;
  }
  
  // 주식수 단위인지 판단
  const isVolumeUnit = detectVolumeUnit(flowRows);
  
  // 주식수 단위면 가격을 곱해서 금액으로 변환
  let processedFlowRows = flowRows;
  if (isVolumeUnit) {
    processedFlowRows = flowRows.map(fr => {
      const dateKey = fmtDate(fr.date || fr.Date || fr["날짜"]);
      const priceRow = priceRows.find(p => fmtDate(p.date || p.Date || p["날짜"]) === dateKey);
      
      if (!priceRow || !priceRow.close) return fr;
      
      const multiplier = toNum(priceRow.close);
      const converted = { ...fr };
      
      // 숫자 필드만 변환
      const numericKeys = ["금융투자", "보험", "투신", "사모", "은행", "기타금융", "연기금", "기타법인", "개인", "외국인", "기타외국인", "기관합계"];
      numericKeys.forEach(key => {
        if (fr[key] !== undefined) {
          converted[key] = toNum(fr[key]) * multiplier;
        }
      });
      
      return converted;
    });
  }
  
  // 날짜별 Map 생성
  const byDate = new Map();
  processedFlowRows.forEach((r, idx) => {
    const dateKey = fmtDate(r.date || r.Date || r["날짜"]);
    byDate.set(dateKey, r);
    if (idx < 3) {
      console.log(`Flow row ${idx} - date: ${r.date || r.Date || r["날짜"]} -> key: ${dateKey}`);
    }
  });
  
  console.log('byDate Map size:', byDate.size);
  console.log('byDate keys sample:', Array.from(byDate.keys()).slice(0, 3));

  // Prepare cumulative map for detailed categories
  const cats = [
    "금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인","개인","외국인","기타외국인","기관합계","외국인합계"
  ];
  const cumMap = Object.fromEntries(cats.map((k) => [k, 0]));

  let cumF = 0, cumI = 0, cumP = 0;

  return priceRows.map((p, idx) => {
    const priceDate = p.date || p.Date || p["날짜"];
    const key = fmtDate(priceDate);
    const fr = byDate.get(key);
    
    if (idx < 3) {
      console.log(`Price row ${idx} - date: ${priceDate} -> key: ${key} -> matched: ${!!fr}`);
      if (fr) {
        console.log('Matched flow data:', { 금융투자: fr["금융투자"], 개인: fr["개인"] });
      }
    }
    
    const flowData = fr || {};

    // Compose details
    const details = {
      금융투자: toNum(flowData["금융투자"]) || 0,
      보험: toNum(flowData["보험"]) || 0,
      투신: toNum(flowData["투신"]) || 0,
      사모: toNum(flowData["사모"]) || 0,
      은행: toNum(flowData["은행"]) || 0,
      기타금융: toNum(flowData["기타금융"]) || 0,
      연기금: toNum(flowData["연기금"]) || 0,
      기타법인: toNum(flowData["기타법인"]) || 0,
      개인: toNum(flowData["개인"]) || 0,
      외국인: toNum(flowData["외국인"]) || 0,
      기타외국인: toNum(flowData["기타외국인"]) || 0,
      기관합계: toNum(flowData["기관합계"]) || 0,
    };
    if (!details.기관합계) {
      details.기관합계 = ["금융투자","보험","투신","사모","은행","기타금융","연기금","기타법인"].reduce((s,k)=>s+toNum(details[k]),0);
    }
    details["외국인합계"] = details.외국인 + details.기타외국인;

    // For backward-compatibility (existing charts): foreign/institution totals
    const f = toNum(flowData.foreign ?? details["외국인합계"]) || 0;
    const i = toNum(flowData.institution ?? details["기관합계"]) || 0;
    const person = details.개인 || 0;
    
    if (idx < 3) {
      console.log(`Row ${idx} details:`, { 
        금융투자: details.금융투자, 
        개인: details.개인,
        기관합계: details.기관합계,
        외국인합계: details.외국인합계
      });
    }

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