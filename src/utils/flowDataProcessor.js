// 수급 데이터 처리 전용 모듈
// 날짜 매칭 문제를 완전히 해결

import { toNum } from './dataUtils';
import { debugFlowData } from './debugFlowData';

// 날짜를 YYYY-MM-DD 형식으로 정규화
export function normalizeDate(dateStr) {
  if (!dateStr) return '';
  
  const str = String(dateStr).trim();
  
  // ISO 형식에서 날짜 부분만 추출
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  
  // YYYY/MM/DD를 YYYY-MM-DD로 변환
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  
  // YYYY-M-D를 YYYY-MM-DD로 변환
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  
  return str;
}

// CSV 텍스트를 파싱하여 수급 데이터 반환
export function parseFlowCSV(csvText) {
  if (!csvText) return [];
  
  // BOM 제거 - 매우 철저하게
  let cleanText = csvText;
  
  // UTF-8 BOM (EF BB BF)
  while (cleanText.charCodeAt(0) === 0xEF && 
         cleanText.charCodeAt(1) === 0xBB && 
         cleanText.charCodeAt(2) === 0xBF) {
    cleanText = cleanText.substring(3);
  }
  
  // UTF-16 BOM (FE FF or FF FE)
  while (cleanText.charCodeAt(0) === 0xFEFF || 
         cleanText.charCodeAt(0) === 0xFFFE ||
         cleanText.charCodeAt(0) === 65279) {
    cleanText = cleanText.substring(1);
  }
  
  // 다른 형태의 BOM 제거
  cleanText = cleanText.replace(/^\uFEFF/, '');
  cleanText = cleanText.replace(/^\xEF\xBB\xBF/, '');
  cleanText = cleanText.replace(/^﻿/, '');
  
  const lines = cleanText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  // 헤더 파싱
  const firstLine = lines[0];
  const headers = firstLine.split(',').map((h, idx) => {
    // 각 헤더 정리
    let cleaned = h.trim();
    
    // 첫 번째 헤더는 특별히 BOM 제거
    if (idx === 0) {
      // 모든 가능한 BOM 제거
      cleaned = cleaned.replace(/^[\uFEFF\xEF\xBB\xBF]/, '');
      cleaned = cleaned.replace(/^﻿/, '');
      // "날짜"만 남기기
      if (cleaned.includes('날짜')) {
        cleaned = '날짜';
      }
    }
    
    return cleaned;
  });
  
  console.log('Clean headers:', headers);
  console.log('Headers includes 외국인?', headers.includes('외국인'));
  console.log('Headers includes 기타외국인?', headers.includes('기타외국인'));
  
  // 데이터 파싱
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });
    
    data.push(row);
  }
  
  console.log('Parsed', data.length, 'rows from CSV');
  if (data.length > 0) {
    console.log('First row keys:', Object.keys(data[0]));
    console.log('First row 외국인:', data[0]['외국인']);
    console.log('First row 기타외국인:', data[0]['기타외국인']);
    console.log('First row 개인:', data[0]['개인']);
  }
  
  return data;
}

// 수급 데이터를 정규화
export function normalizeFlowData(flowRows) {
  if (!flowRows || flowRows.length === 0) return [];
  
  return flowRows.map((row, idx) => {
    // 날짜 찾기
    const dateValue = row['날짜'] || row['date'] || row['Date'] || Object.values(row)[0];
    
    const normalized = {
      date: normalizeDate(dateValue),
      금융투자: toNum(row['금융투자'] || 0),
      보험: toNum(row['보험'] || 0),
      투신: toNum(row['투신'] || 0),
      사모: toNum(row['사모'] || 0),
      은행: toNum(row['은행'] || 0),
      기타금융: toNum(row['기타금융'] || 0),
      연기금: toNum(row['연기금'] || 0),
      기타법인: toNum(row['기타법인'] || 0),
      개인: toNum(row['개인'] || 0),
      외국인: toNum(row['외국인'] || 0),
      기타외국인: toNum(row['기타외국인'] || 0),
      기관합계: toNum(row['기관합계'] || 0)
    };
    
    if (idx === 0) {
      console.log('First normalized flow row:', {
        date: normalized.date,
        외국인: normalized.외국인,
        기타외국인: normalized.기타외국인,
        개인: normalized.개인,
        기관합계: normalized.기관합계
      });
    }
    
    // 기관합계가 없으면 계산
    if (!normalized.기관합계) {
      normalized.기관합계 = 
        normalized.금융투자 + normalized.보험 + normalized.투신 + 
        normalized.사모 + normalized.은행 + normalized.기타금융 + 
        normalized.연기금 + normalized.기타법인;
    }
    
    // 외국인합계 계산
    normalized.외국인합계 = normalized.외국인 + normalized.기타외국인;
    
    return normalized;
  });
}

// 가격 데이터와 수급 데이터 병합
export function mergeFlowWithPrice(priceRows, flowRows) {
  if (!priceRows || priceRows.length === 0) return priceRows;
  if (!flowRows || flowRows.length === 0) return priceRows;
  
  // 수급 데이터를 날짜별 Map으로 변환
  const flowMap = new Map();
  flowRows.forEach(row => {
    const date = normalizeDate(row.date);
    if (date) {
      flowMap.set(date, row);
    }
  });
  
  console.log('Flow map created with', flowMap.size, 'entries');
  console.log('Sample flow dates:', Array.from(flowMap.keys()).slice(0, 5));
  
  // 누적 계산용 변수
  const categories = ['금융투자', '보험', '투신', '사모', '은행', '기타금융', '연기금', '기타법인', '개인', '외국인', '기타외국인', '기관합계', '외국인합계'];
  const cumulative = {};
  categories.forEach(cat => { cumulative[cat] = 0; });
  
  let cumForeign = 0;
  let cumInst = 0;
  let cumPerson = 0;
  
  // 가격 데이터에 수급 데이터 병합
  return priceRows.map((priceRow, idx) => {
    const priceDate = normalizeDate(priceRow.date || priceRow.Date);
    const flowData = flowMap.get(priceDate);
    
    if (idx < 5) {
      console.log(`\n=== Merging row ${idx} ===`);
      console.log(`Price date: ${priceDate}`);
      console.log(`Flow data found: ${!!flowData}`);
      if (flowData) {
        console.log('Flow data details:', { 
          금융투자: flowData.금융투자, 
          개인: flowData.개인,
          외국인: flowData.외국인,
          기타외국인: flowData.기타외국인,
          외국인합계: flowData.외국인합계,
          기관합계: flowData.기관합계
        });
        console.log('외국인 type:', typeof flowData.외국인);
        console.log('외국인합계 type:', typeof flowData.외국인합계);
      } else {
        console.log('NO FLOW DATA FOUND FOR THIS DATE!');
      }
    }
    
    // 수급 데이터가 있으면 사용, 없으면 0
    const flows = flowData || {
      금융투자: 0, 보험: 0, 투신: 0, 사모: 0, 은행: 0,
      기타금융: 0, 연기금: 0, 기타법인: 0, 개인: 0,
      외국인: 0, 기타외국인: 0, 기관합계: 0, 외국인합계: 0
    };
    
    // 누적 계산
    categories.forEach(cat => {
      cumulative[cat] += flows[cat] || 0;
    });
    
    cumForeign += flows.외국인합계 || 0;
    cumInst += flows.기관합계 || 0;
    cumPerson += flows.개인 || 0;
    
    const result = {
      ...priceRow,
      _flows: { ...flows },
      _cum: { ...cumulative },
      cumForeign,
      cumInst,
      cumPerson,
      foreign: flows.외국인합계 || 0,
      inst: flows.기관합계 || 0,
      person: flows.개인 || 0
    };
    
    if (idx < 5) {
      console.log(`Final merged result for row ${idx}:`, {
        date: result.date,
        foreign: result.foreign,
        cumForeign: result.cumForeign,
        '_flows.외국인합계': result._flows?.외국인합계,
        '_cum.외국인합계': result._cum?.외국인합계
      });
    }
    
    return result;
  });
}

// 주식수 단위인지 판단
export function isVolumeUnit(flowRows) {
  if (!flowRows || flowRows.length === 0) return false;
  
  const firstRow = flowRows[0];
  // 숫자 필드만 추출 (날짜 제외)
  const numericKeys = ['금융투자', '보험', '투신', '사모', '은행', '기타금융', '연기금', '기타법인', '개인', '외국인', '기타외국인', '기관합계'];
  
  const values = [];
  numericKeys.forEach(key => {
    const val = firstRow[key];
    if (typeof val === 'number' && val !== 0) {
      values.push(Math.abs(val));
    }
  });
  
  if (values.length === 0) return false;
  
  const maxValue = Math.max(...values);
  const isVolume = maxValue < 1000000; // 100만 미만이면 주식수로 판단
  
  console.log('Volume unit detection:', {
    maxValue,
    isVolume,
    sampleValues: values.slice(0, 5),
    '외국인': firstRow['외국인'],
    '기타외국인': firstRow['기타외국인']
  });
  
  return isVolume;
}

// 주식수를 금액으로 변환
export function convertVolumeToAmount(flowRows, priceRows) {
  if (!flowRows || flowRows.length === 0) return flowRows;
  if (!priceRows || priceRows.length === 0) return flowRows;
  
  // 가격 데이터 Map 생성
  const priceMap = new Map();
  priceRows.forEach(row => {
    const date = normalizeDate(row.date || row.Date);
    if (date && row.close) {
      priceMap.set(date, toNum(row.close));
    }
  });
  
  // 수급 데이터 변환
  return flowRows.map((flowRow, idx) => {
    const date = normalizeDate(flowRow.date);
    const price = priceMap.get(date);
    
    if (!price) {
      console.log(`No price found for date ${date}`);
      return flowRow;
    }
    
    const converted = { ...flowRow };
    const numericKeys = ['금융투자', '보험', '투신', '사모', '은행', '기타금융', '연기금', '기타법인', '개인', '외국인', '기타외국인', '기관합계'];
    
    numericKeys.forEach(key => {
      if (typeof converted[key] === 'number') {
        converted[key] = converted[key] * price;
      }
    });
    
    // 외국인합계 재계산 (변환 후)
    if (converted['외국인'] !== undefined && converted['기타외국인'] !== undefined) {
      converted['외국인합계'] = (converted['외국인'] || 0) + (converted['기타외국인'] || 0);
    }
    
    if (idx === 0) {
      console.log('Volume to amount conversion:', {
        date,
        price,
        '외국인_before': flowRow['외국인'],
        '외국인_after': converted['외국인'],
        '외국인합계_after': converted['외국인합계']
      });
    }
    
    return converted;
  });
}

// 통합 처리 함수
export function processFlowData(flowCSV, priceRows) {
  console.log('processFlowData called');
  
  if (!flowCSV || !priceRows) {
    console.log('Missing flow CSV or price rows');
    return priceRows || [];
  }
  
  // 디버깅: 외국인 데이터 확인
  debugFlowData(flowCSV);
  
  // 1. CSV 파싱
  const rawFlowData = parseFlowCSV(flowCSV);
  console.log('Parsed', rawFlowData.length, 'flow rows');
  
  if (rawFlowData.length === 0) {
    console.log('No flow data parsed');
    return priceRows;
  }
  
  // 2. 데이터 정규화
  let flowData = normalizeFlowData(rawFlowData);
  console.log('Normalized', flowData.length, 'flow rows');
  
  // 3. 주식수 단위 확인 및 변환
  if (isVolumeUnit(flowData)) {
    console.log('Volume unit detected, converting to amount');
    flowData = convertVolumeToAmount(flowData, priceRows);
  }
  
  // 4. 가격 데이터와 병합
  const merged = mergeFlowWithPrice(priceRows, flowData);
  console.log('Merged data created');
  
  return merged;
}

export default {
  normalizeDate,
  parseFlowCSV,
  normalizeFlowData,
  mergeFlowWithPrice,
  isVolumeUnit,
  convertVolumeToAmount,
  processFlowData
};