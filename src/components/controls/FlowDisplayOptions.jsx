import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ALL_INVESTOR_CATEGORIES } from "../../constants/sampleData";

export default function FlowDisplayOptions({ unitScale, setUnitScale, selectedCats, toggleCat }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">수급 표시 옵션</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">단위:</span>
          <Button variant={unitScale === 1 ? "default" : "secondary"} onClick={() => setUnitScale(1)}>원</Button>
          <Button variant={unitScale === 1000000 ? "default" : "secondary"} onClick={() => setUnitScale(1000000)}>백만원</Button>
          <Button variant={unitScale === 100000000 ? "default" : "secondary"} onClick={() => setUnitScale(100000000)}>억원</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {ALL_INVESTOR_CATEGORIES.map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={selectedCats.includes(k)} onChange={() => toggleCat(k)} />
              <span>{k}</span>
            </label>
          ))}
        </div>
        <div className="text-xs text-slate-500">외국인합계 = 외국인 + 기타외국인 (표시용 계산)</div>
      </CardContent>
    </Card>
  );
}