import { useState, useCallback } from "react";
import { parseCSV, toNum } from "../utils/dataUtils";
import { parseInvestorFlowCSV } from "../utils/investorUtils";
import { computeIndicators, mergeInvestorFlows } from "../utils/indicatorUtils";
import { sampleOHLCV, sampleFlowBreakdown } from "../constants/sampleData";

export function useSelfTest() {
  const [testLog, setTestLog] = useState([]);

  const runSelfTests = useCallback(() => {
    const logs = [];
    try {
      // Test 1: parseCSV basic
      const t1 = parseCSV("Date,Open,High,Low,Close,Volume\n2025-01-01,1,2,0.5,1.5,100");
      if (t1.length !== 1) throw new Error("parseCSV length mismatch");
      logs.push("✓ parseCSV loads 1 row");

      // Test 2: indicators range (MFI 0~100)
      const { data: ind } = computeIndicators(sampleOHLCV, 0);
      const mfiVals = ind.map((d) => d.mfi14).filter((v) => v != null);
      if (mfiVals.some((v) => v < 0 || v > 100)) throw new Error("MFI out of range");
      logs.push("✓ MFI(14) within 0-100");

      // Test 3: mergeInvestorFlows cumulative consistency (simple dataset)
      const mergedTest = mergeInvestorFlows(sampleOHLCV, sampleFlowBreakdown);
      const last = mergedTest[mergedTest.length - 1];
      const sumForeign = sampleFlowBreakdown.reduce((a, b) => a + toNum(b.외국인 || 0) + toNum(b.기타외국인 || 0), 0);
      const sumInst = sampleFlowBreakdown.reduce((a, b) => a + toNum(b.기관합계 || 0), 0);
      if (last.cumForeign !== sumForeign || last.cumInst !== sumInst) throw new Error("Cumulative flow mismatch");
      logs.push("✓ Cumulative totals (외국인합계/기관합계) match");

      // Test 4: KRX-style row with scientific notation + 기관합계 auto-sum
      const krxLine = "날짜\t금융투자\t보험\t투신\t사모\t은행\t기타금융\t연기금\t기타법인\t개인\t외국인\t기타외국인\t기관합계\n2020-08-10\t-1.1E+09\t-3.3E+08\t-2.3E+08\t44312800\t0\t0\t8486650\t143419300\t5094342700\t-3.6E+09\t10170600\t";
      const parsedKRX = parseInvestorFlowCSV(krxLine);
      if (parsedKRX.length !== 1) throw new Error("KRX parse failed");
      const row = parsedKRX[0];
      const parts = row.금융투자 + row.보험 + row.투신 + row.사모 + row.은행 + row.기타금융 + row.연기금 + row.기타법인;
      if (Math.abs(row.기관합계 - parts) > 1) throw new Error("기관합계 autosum mismatch");
      logs.push("✓ KRX row parse + autosum OK");

      // Test: space-delimited KRX sample (user's format)
      const spaceHeader = "날짜 금융투자 보험 투신 사모 은행 기타금융 연기금 기타법인 개인 외국인 기타외국인 기관합계";
      const spaceRow = "2020-08-10 -1120696400 -333365000 -229195850 44312800 0 0 8486650 143419300 5094342700 -3617474800 10170600 -1487038500";
      const parsedSpace = parseInvestorFlowCSV(`${spaceHeader}\n${spaceRow}`);
      if (parsedSpace.length !== 1 || typeof parsedSpace[0].기관합계 !== "number") {
        throw new Error("Space-delimited parse failed");
      }
      logs.push("✓ Space-delimited KRX CSV parsed (기관합계 recognized)");

      setTestLog(logs);
    } catch (err) {
      logs.push(`✗ Test failed: ${err.message}`);
      setTestLog(logs);
    }
  }, []);

  return { testLog, runSelfTests };
}