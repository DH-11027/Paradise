// 강력한 CSV 파서 - BOM과 한글 처리 최적화
import logger from '../lib/logger';

export function robustParseCSV(text) {
  if (!text) return [];
  
  // 1. 모든 종류의 BOM 제거
  let cleanText = text;
  
  // UTF-8 BOM
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.substring(1);
  }
  
  // 다른 형태의 BOM들
  cleanText = cleanText.replace(/^\uFEFF/, '');
  cleanText = cleanText.replace(/^\xEF\xBB\xBF/, '');
  cleanText = cleanText.replace(/^﻿/, '');
  
  // 앞뒤 공백 제거
  cleanText = cleanText.trim();
  
  // 2. 줄 단위로 분리
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    logger.warn('CSV has less than 2 lines');
    return [];
  }
  
  // 3. 구분자 감지 (콤마 또는 탭)
  const firstLine = lines[0];
  let separator = ',';
  
  if (firstLine.includes('\t')) {
    separator = '\t';
  }
  
  // 4. 헤더 파싱
  const headers = parseLine(firstLine, separator).map(h => {
    // 헤더에서도 BOM 제거
    let clean = h.trim();
    clean = clean.replace(/^\uFEFF/, '');
    clean = clean.replace(/^\xEF\xBB\xBF/, '');
    clean = clean.replace(/^﻿/, '');
    return clean;
  });
  
  logger.log('Parsed headers:', headers);
  
  // 5. 데이터 행 파싱
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], separator);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

// CSV 라인 파싱 (따옴표 처리 포함)
function parseLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 이중 따옴표는 하나의 따옴표로
        current += '"';
        i++; // 다음 따옴표 건너뛰기
      } else {
        // 따옴표 모드 토글
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      // 구분자를 만났고 따옴표 안이 아니면 필드 구분
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 마지막 필드 추가
  result.push(current.trim());
  
  return result;
}

// 투자자 수급 데이터 전용 파서
export function parseInvestorFlowData(text) {
  const rows = robustParseCSV(text);
  
  if (rows.length === 0) {
    logger.warn('No rows parsed from investor flow data');
    return [];
  }
  
  // 헤더 확인
  const firstRow = rows[0];
  const headers = Object.keys(firstRow);
  logger.log('Investor flow headers:', headers);
  
  // 날짜 필드 찾기
  const dateField = headers.find(h => 
    h === '날짜' || 
    h === 'date' || 
    h === 'Date' || 
    h.includes('날짜')
  );
  
  if (!dateField) {
    logger.warn('No date field found, using first column');
  }
  
  // 데이터 정규화
  return rows.map((row, idx) => {
    const normalized = {};
    
    // 날짜
    normalized.date = row[dateField] || row[headers[0]] || '';
    
    // 투자자별 수급 (한글 키 그대로 사용)
    const investorKeys = [
      '금융투자', '보험', '투신', '사모', '은행', 
      '기타금융', '연기금', '기타법인', '개인', 
      '외국인', '기타외국인', '기관합계'
    ];
    
    investorKeys.forEach(key => {
      const value = row[key];
      normalized[key] = parseNumber(value);
    });
    
    if (idx === 0) {
      logger.log('First normalized row:', normalized);
    }
    
    // 기관합계가 없으면 계산
    if (!normalized['기관합계'] || normalized['기관합계'] === 0) {
      const institutionKeys = [
        '금융투자', '보험', '투신', '사모', '은행', 
        '기타금융', '연기금', '기타법인'
      ];
      normalized['기관합계'] = institutionKeys.reduce((sum, key) => 
        sum + (normalized[key] || 0), 0
      );
    }
    
    // 외국인합계 계산
    normalized['외국인합계'] = (normalized['외국인'] || 0) + (normalized['기타외국인'] || 0);
    
    return normalized;
  }).filter(row => row.date); // 날짜가 있는 행만 반환
}

// 숫자 파싱 헬퍼
function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).trim();
  if (str === '' || str === '-') return 0;
  
  // 콤마 제거
  const cleaned = str.replace(/,/g, '');
  
  // 숫자로 변환
  const num = Number(cleaned);
  return isFinite(num) ? num : 0;
}

export default {
  robustParseCSV,
  parseInvestorFlowData
};
