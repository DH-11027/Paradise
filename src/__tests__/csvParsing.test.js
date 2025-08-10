import { parseCSV } from '../utils/dataUtils';
import { parseInvestorFlowCSV } from '../utils/investorUtils';
import { parseInvestorFlowData } from '../utils/robustCSVParser';

const testFlowCSV = `날짜,금융투자,보험,투신,사모,은행,기타금융,연기금,기타법인,개인,외국인,기타외국인,기관합계,전체
2020-08-10,-1120696400,-333365000,-229195850,44312800,0,0,8486650,143419300,5094342700,-3617474800,10170600,-1487038500,0
2020-08-11,615642250,137802200,930901300,28587900,0,0,0,206228400,-1418363250,-476630700,-24168100,1919162050,0`;

const testFlowCSVWithBOM = '\uFEFF' + testFlowCSV;

describe('CSV parsing utilities', () => {
  test('parseCSV parses basic CSV', () => {
    const parsed = parseCSV(testFlowCSV);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['날짜']).toBe('2020-08-10');
  });

  test('parseCSV handles BOM', () => {
    const parsed = parseCSV(testFlowCSVWithBOM);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['날짜']).toBe('2020-08-10');
  });

  test('parseInvestorFlowCSV parses investor flow data', () => {
    const parsed = parseInvestorFlowCSV(testFlowCSV);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      date: '2020-08-10',
      금융투자: -1120696400,
      개인: 5094342700,
    });
  });

  test('parseInvestorFlowCSV handles BOM', () => {
    const parsed = parseInvestorFlowCSV(testFlowCSVWithBOM);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].date).toBe('2020-08-10');
  });

  test('parseInvestorFlowData parses data robustly', () => {
    const parsed = parseInvestorFlowData(testFlowCSV);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      date: '2020-08-10',
      금융투자: -1120696400,
      개인: 5094342700,
    });
  });

  test('parseInvestorFlowData handles BOM', () => {
    const parsed = parseInvestorFlowData(testFlowCSVWithBOM);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].date).toBe('2020-08-10');
  });
});
