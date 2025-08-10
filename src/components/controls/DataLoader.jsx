import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, Database } from "lucide-react";

export default function DataLoader({ setUseSample, setPriceCSV, setFlowCSV, setAnchorIndex }) {
  const loadLocalData = async () => {
    try {
      // 가격 데이터 로드
      const priceResponse = await fetch('/price_data.csv');
      const priceText = await priceResponse.text();
      setPriceCSV(priceText);
      
      // 수급 데이터 로드 (금액 단위)
      const flowResponse = await fetch('/flows_data.csv');
      const flowText = await flowResponse.text();
      setFlowCSV(flowText);
      
      setAnchorIndex(0);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다. CSV 파일을 직접 업로드해주세요.');
    }
  };
  
  const loadVolumeData = async () => {
    try {
      // 가격 데이터 로드
      const priceResponse = await fetch('/price_data.csv');
      const priceText = await priceResponse.text();
      setPriceCSV(priceText);
      
      // 수급 데이터 로드 (주식수 단위)
      const flowResponse = await fetch('/flows_volume.csv');
      const flowText = await flowResponse.text();
      setFlowCSV(flowText);
      
      setAnchorIndex(0);
      console.log('주식수 단위 데이터 로드 완료');
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다. CSV 파일을 직접 업로드해주세요.');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">데이터 로드</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadLocalData}>
            <Database className="w-4 h-4 mr-2"/>금액 단위 로드
          </Button>
          <Button variant="outline" onClick={loadVolumeData}>
            <Database className="w-4 h-4 mr-2"/>주식수 단위 로드
          </Button>
          <Button variant="ghost" onClick={() => { setAnchorIndex(0); }}>
            <RefreshCw className="w-4 h-4 mr-2"/>VWAP 앵커 초기화
          </Button>
        </div>
        <div className="text-xs text-slate-500 leading-relaxed">
          <div>① 가격/거래량 CSV: <code>Date,Open,High,Low,Close,Volume</code></div>
          <div>② 수급 CSV: <code>날짜,금융투자,보험,투신,사모,은행,기타금융,연기금,기타법인,개인,외국인,기타외국인,기관합계</code></div>
          <div>③ 또는 단일 CSV(가격+수급)도 지원: <code>Date,Open,High,Low,Close,Volume,[수급열...] </code> (좌측 텍스트박스에만 붙여넣기)</div>
          <div className="mt-1">* 수급 단위: 원(KRW) 기준으로 입력된 값을 사용합니다. 아래 단위 토글로 시각화 단위를 바꿀 수 있어요.</div>
        </div>
      </CardContent>
    </Card>
  );
}