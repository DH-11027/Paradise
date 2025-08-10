// CSV 파싱 테스트 스크립트

import { parseCSV } from './utils/dataUtils';
import { parseInvestorFlowCSV } from './utils/investorUtils';
import { robustParseCSV, parseInvestorFlowData } from './utils/robustCSVParser';

// 테스트 데이터 (실제 파일과 동일한 형식)
const testFlowCSV = `날짜,금융투자,보험,투신,사모,은행,기타금융,연기금,기타법인,개인,외국인,기타외국인,기관합계,전체
2020-08-10,-1120696400,-333365000,-229195850,44312800,0,0,8486650,143419300,5094342700,-3617474800,10170600,-1487038500,0
2020-08-11,615642250,137802200,930901300,28587900,0,0,0,206228400,-1418363250,-476630700,-24168100,1919162050,0`;

// BOM이 포함된 테스트 데이터
const testFlowCSVWithBOM = '\uFEFF' + testFlowCSV;

export function testParsing() {
  console.log('=== CSV 파싱 테스트 시작 ===');
  
  // 1. 일반 CSV 파싱 테스트
  console.log('\n1. 일반 parseCSV 테스트:');
  const parsed1 = parseCSV(testFlowCSV);
  console.log('파싱된 행 수:', parsed1.length);
  console.log('첫 번째 행:', parsed1[0]);
  
  // 2. BOM 포함 CSV 파싱 테스트
  console.log('\n2. BOM 포함 parseCSV 테스트:');
  const parsed2 = parseCSV(testFlowCSVWithBOM);
  console.log('파싱된 행 수:', parsed2.length);
  console.log('첫 번째 행:', parsed2[0]);
  
  // 3. 투자자 플로우 CSV 파싱 테스트
  console.log('\n3. parseInvestorFlowCSV 테스트:');
  const parsed3 = parseInvestorFlowCSV(testFlowCSV);
  console.log('파싱된 행 수:', parsed3.length);
  console.log('첫 번째 행:', parsed3[0]);
  
  // 4. BOM 포함 투자자 플로우 CSV 파싱 테스트
  console.log('\n4. BOM 포함 parseInvestorFlowCSV 테스트:');
  const parsed4 = parseInvestorFlowCSV(testFlowCSVWithBOM);
  console.log('파싱된 행 수:', parsed4.length);
  console.log('첫 번째 행:', parsed4[0]);
  
  // 5. 강력한 파서 테스트
  console.log('\n5. 강력한 파서 테스트:');
  const parsed5 = parseInvestorFlowData(testFlowCSV);
  console.log('파싱된 행 수:', parsed5.length);
  console.log('첫 번째 행:', parsed5[0]);
  
  // 6. BOM 포함 강력한 파서 테스트
  console.log('\n6. BOM 포함 강력한 파서 테스트:');
  const parsed6 = parseInvestorFlowData(testFlowCSVWithBOM);
  console.log('파싱된 행 수:', parsed6.length);
  console.log('첫 번째 행:', parsed6[0]);
  
  // 7. 실제 파일 테스트
  console.log('\n7. 실제 파일 로드 테스트:');
  fetch('/flows_data.csv')
    .then(res => res.text())
    .then(text => {
      console.log('파일 크기:', text.length);
      console.log('첫 100자:', text.substring(0, 100));
      
      // 강력한 파서로 테스트
      const robustParsed = parseInvestorFlowData(text);
      console.log('[강력한 파서] 파싱된 행 수:', robustParsed.length);
      if (robustParsed.length > 0) {
        console.log('[강력한 파서] 첫 번째 행:', robustParsed[0]);
      }
      
      // 기존 파서로도 테스트
      const oldParsed = parseInvestorFlowCSV(text);
      console.log('[기존 파서] 파싱된 행 수:', oldParsed.length);
      if (oldParsed.length > 0) {
        console.log('[기존 파서] 첫 번째 행:', oldParsed[0]);
      }
    })
    .catch(err => console.error('파일 로드 실패:', err));
    
  console.log('=== 테스트 완료 ===');
}

// 자동 실행
if (typeof window !== 'undefined') {
  window.testCSVParsing = testParsing;
  console.log('브라우저 콘솔에서 testCSVParsing()을 실행하세요.');
}