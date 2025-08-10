import { useMemo } from "react";
import { parseCSV, toNum } from "../utils/dataUtils";
import { parseInvestorFlowCSV } from "../utils/investorUtils";
import { parseInvestorFlowData } from "../utils/robustCSVParser";
import { processFlowData } from "../utils/flowDataProcessor";
import { computeIndicators, mergeInvestorFlows } from "../utils/indicatorUtils";
import { sampleOHLCV, sampleFlowBreakdown } from "../constants/sampleData";

export function useDataProcessing(priceCSV, flowCSV, useSample, anchorIndex) {
  const priceRows = useMemo(() => {
    if (!priceCSV) return [];
    const raw = parseCSV(priceCSV);
    // Flexible header mapping (supports merged single-CSV that already includes flow columns)
    return raw
      .map((r) => ({
        date: r.date || r.Date || r["날짜"],
        open: toNum(r.open ?? r.Open ?? r["시가"]),
        high: toNum(r.high ?? r.High ?? r["고가"]),
        low: toNum(r.low ?? r.Low ?? r["저가"]),
        close: toNum(r.close ?? r.Close ?? r["종가"]),
        volume: toNum(r.volume ?? r.Volume ?? r["거래량"]),
        // if merged CSV, keep possible flow fields too (will be ignored here)
        foreign: toNum(
          r.foreign ?? r.Foreign ?? r["외국인"] ?? r["ForeignNetBuy"] ?? r["ForeignNetBuy_MKRW"]
        ),
        institution: toNum(
          r.institution ?? r.Institution ?? r["기관"] ?? r["InstitutionNetBuy"] ?? r["InstitutionNetBuy_MKRW"]
        ),
      }))
      .filter((r) => r.date && r.close)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [priceCSV]);

  const flowRows = useMemo(() => {
    console.log('useDataProcessing flowRows - flowCSV exists:', !!flowCSV);
    console.log('flowCSV length:', flowCSV?.length);
    
    if (!flowCSV) return [];

    // 새로운 강력한 파서 사용
    try {
      const detailed = parseInvestorFlowData(flowCSV);
      console.log('Robust parser result:', detailed.length, 'rows');
      if (detailed.length > 0) {
        console.log('First row from robust parser:', detailed[0]);
        return detailed;
      }
    } catch (error) {
      console.error('Robust parser failed:', error);
    }
    
    // 기존 파서로 폴백
    const detailed = parseInvestorFlowCSV(flowCSV);
    console.log('Fallback parser result:', detailed.length, 'rows');
    if (detailed.length > 0) {
      console.log('First detailed row:', detailed[0]);
      return detailed;
    }

    // 2) Fallback to simple flow CSV if provided
    const raw = parseCSV(flowCSV);
    let parsed = raw
      .map((r) => ({
        date: r.date || r.Date || r["날짜"],
        foreign: toNum(
          r.foreign ?? r.Foreign ?? r["외국인"] ?? r["ForeignNetBuy"] ?? r["ForeignNetBuy_MKRW"]
        ),
        institution: toNum(
          r.institution ?? r.Institution ?? r["기관"] ?? r["InstitutionNetBuy"] ?? r["InstitutionNetBuy_MKRW"]
        ),
      }))
      .filter((r) => r.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3) If user provided a single merged CSV (only in left textarea), derive from priceRows
    if (parsed.length === 0 && priceRows.length > 0) {
      const derived = priceRows
        .filter((p) => p.date && (p.foreign !== undefined || p.institution !== undefined))
        .map((p) => ({ date: p.date, foreign: toNum(p.foreign), institution: toNum(p.institution) }));
      if (derived.length > 0) parsed = derived;
    }

    return parsed;
  }, [flowCSV, priceRows]);

  // 새로운 통합 처리 방식 사용
  const merged = useMemo(() => {
    if (!flowCSV || !priceRows || priceRows.length === 0) {
      // 수급 데이터 없이 가격 데이터만 사용
      return priceRows;
    }
    
    // 새로운 프로세서로 수급 데이터 처리 및 병합
    const result = processFlowData(flowCSV, priceRows);
    console.log('Final merged data:', result.length, 'rows');
    if (result.length > 0 && result[result.length - 1]._flows) {
      console.log('Last row flows:', result[result.length - 1]._flows);
    }
    return result;
  }, [priceRows, flowCSV]);
  
  const { data: enriched } = useMemo(() => computeIndicators(merged, anchorIndex), [merged, anchorIndex]);

  return { priceRows, flowRows, merged, enriched };
}