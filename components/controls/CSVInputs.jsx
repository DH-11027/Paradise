import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function CSVInputs({ priceCSV, setPriceCSV, flowCSV, setFlowCSV }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">가격/거래량 CSV 붙여넣기</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring focus:ring-slate-200 text-sm font-mono"
            placeholder="Date,Open,High,Low,Close,Volume\n2025-07-10,17500,17800,17350,17720,1150000\n..."
            value={priceCSV}
            onChange={(e) => setPriceCSV(e.target.value)}
          />
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">수급 CSV 붙여넣기 (KRX 세부)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring focus:ring-slate-200 text-sm font-mono"
            placeholder="날짜,금융투자,보험,투신,사모,은행,기타금융,연기금,기타법인,개인,외국인,기타외국인,기관합계\n2020-08-10,-1120696400,-333365000,-229195850,44312800,0,0,8486650,143419300,5094342700,-3617474800,10170600,-1487038500\n..."
            value={flowCSV}
            onChange={(e) => setFlowCSV(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}