// 외국인 수급 데이터 디버깅 전용 모듈

export function debugFlowData(csvText) {
  console.log('=== FLOW DATA DEBUGGING START ===');
  
  // 1. Raw CSV 확인
  console.log('CSV length:', csvText.length);
  console.log('First 200 chars:', csvText.substring(0, 200));
  
  // 2. 첫 번째 문자 코드 확인
  console.log('First char code:', csvText.charCodeAt(0));
  console.log('Second char code:', csvText.charCodeAt(1));
  console.log('Third char code:', csvText.charCodeAt(2));
  
  // 3. BOM 제거
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF || cleanText.charCodeAt(0) === 65279) {
    console.log('BOM detected, removing...');
    cleanText = cleanText.substring(1);
  }
  
  // 4. 첫 줄 파싱
  const lines = cleanText.split(/\r?\n/);
  console.log('Total lines:', lines.length);
  
  const firstLine = lines[0];
  console.log('First line:', firstLine);
  
  // 5. 헤더 파싱
  const headers = firstLine.split(',');
  console.log('Headers count:', headers.length);
  console.log('Headers:', headers);
  
  // 각 헤더의 정확한 내용 확인
  headers.forEach((header, idx) => {
    console.log(`Header ${idx}: "${header}" (length: ${header.length}, charCodes: ${Array.from(header).map(c => c.charCodeAt(0)).join(',')})`);
  });
  
  // 6. 외국인 관련 헤더 찾기
  const foreignIndex = headers.findIndex(h => h.includes('외국인') && !h.includes('기타'));
  const otherForeignIndex = headers.findIndex(h => h.includes('기타외국인'));
  
  console.log('Foreign index:', foreignIndex);
  console.log('Other foreign index:', otherForeignIndex);
  
  // 7. 첫 번째 데이터 행 파싱
  if (lines.length > 1) {
    const firstDataLine = lines[1];
    const values = firstDataLine.split(',');
    console.log('First data line values count:', values.length);
    
    if (foreignIndex >= 0) {
      console.log(`Foreign value at index ${foreignIndex}:`, values[foreignIndex]);
    }
    if (otherForeignIndex >= 0) {
      console.log(`Other foreign value at index ${otherForeignIndex}:`, values[otherForeignIndex]);
    }
    
    // 전체 값 매핑
    const dataRow = {};
    headers.forEach((header, idx) => {
      dataRow[header] = values[idx];
    });
    console.log('First data row:', dataRow);
    console.log('외국인 field value:', dataRow['외국인']);
    console.log('기타외국인 field value:', dataRow['기타외국인']);
  }
  
  console.log('=== FLOW DATA DEBUGGING END ===');
  
  return {
    headers,
    foreignIndex,
    otherForeignIndex
  };
}

export default debugFlowData;