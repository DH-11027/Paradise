import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Info, TrendingUp, TrendingDown, Users } from "lucide-react";
import { fmtDate, toNum } from "../../utils/dataUtils";
import { INVESTOR_COLORS } from "../../constants/chartColors";

export default function EnhancedInvestorFlowChart({ data, selectedCats, unitScale, unitName }) {
  const latest = data[data.length - 1] || {};
  
  // 오늘의 수급 주체별 순위
  const todayFlows = selectedCats.map(cat => ({
    name: cat,
    value: latest._flows?.[cat] || (cat === "외국인합계" ? 
      (toNum(latest._flows?.["외국인"]) + toNum(latest._flows?.["기타외국인"])) : 0),
    color: INVESTOR_COLORS[cat]
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // 최근 5일 누적 수급
  const recent5Days = data.slice(-5);
  const cumulative5Days = selectedCats.map(cat => {
    const sum = recent5Days.reduce((acc, d) => {
      const value = d._flows?.[cat] || (cat === "외국인합계" ? 
        (toNum(d._flows?.["외국인"]) + toNum(d._flows?.["기타외국인"])) : 0);
      return acc + value;
    }, 0);
    return { name: cat, value: sum, color: INVESTOR_COLORS[cat] };
  }).sort((a, b) => b.value - a.value);

  const formatValue = (value, isScaled = true) => {
    // If isScaled is false, we need to scale the value
    const displayValue = isScaled ? value : value / unitScale;
    if (unitScale === 100000000) return `${displayValue.toFixed(1)}억`;
    if (unitScale === 1000000) return `${displayValue.toFixed(0)}백만`;
    if (unitScale === 1) return `${displayValue.toLocaleString()}원`;
    return displayValue.toLocaleString();
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* 일별 수급 차트 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4"/>
              투자주체별 일별 수급 / 단위: {unitName}
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">투자주체별 순매수 분석</p>
                  <p className="text-sm mb-2">
                    각 투자주체의 일별 순매수 금액을 시각화합니다. 스마트머니(외국인+기관)와 개인의 divergence가 핵심입니다.
                  </p>
                  <div className="text-xs space-y-1">
                    <p>• <span className="text-red-600">위쪽 막대</span>: 순매수 (매수 > 매도)</p>
                    <p>• <span className="text-blue-600">아래쪽 막대</span>: 순매도 (매도 > 매수)</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 오늘의 수급 요약 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">오늘의 수급 TOP 3</h4>
                <span className="text-xs text-gray-500">{fmtDate(latest.date)}</span>
              </div>
              <div className="space-y-1">
                {todayFlows.slice(0, 3).map((flow, idx) => (
                  <div key={flow.name} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: flow.color }}>
                      {idx + 1}. {flow.name}
                    </span>
                    <span className={`text-sm font-bold ${flow.value > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {flow.value > 0 ? '+' : ''}{formatValue(flow.value, false)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 차트 */}
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={data} stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                  <RechartsTooltip 
                    formatter={(v, name) => {
                      if (typeof v === "number") {
                        return [formatValue(v), name];
                      }
                      return v;
                    }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  {selectedCats.map((k) => (
                    <Bar 
                      key={k} 
                      stackId="flows" 
                      name={k} 
                      fill={INVESTOR_COLORS[k]}
                      dataKey={(d) => (d._flows && (d._flows[k] ?? 
                        (k === "외국인합계" ? (toNum(d._flows["외국인"]) + toNum(d._flows["기타외국인"])) : 0))) / unitScale} 
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 5일 누적 요약 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">최근 5일 누적 수급</h4>
              <div className="grid grid-cols-3 gap-2">
                {cumulative5Days.map(flow => (
                  <div key={flow.name} className="text-center">
                    <p className="text-xs" style={{ color: flow.color }}>{flow.name}</p>
                    <p className={`text-sm font-bold ${flow.value > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {flow.value > 0 ? '+' : ''}{formatValue(flow.value, false)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 누적 수급 차트 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              투자주체별 누적 수급 추이 / 단위: {unitName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                  <RechartsTooltip 
                    formatter={(v, name) => {
                      if (typeof v === "number") {
                        return [formatValue(v), name];
                      }
                      return v;
                    }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  {selectedCats.map((k) => (
                    <Line 
                      key={k} 
                      type="monotone" 
                      dot={false} 
                      name={k} 
                      stroke={INVESTOR_COLORS[k]}
                      strokeWidth={2}
                      dataKey={(d) => (d._cum && (d._cum[k] ?? 
                        (k === "외국인합계" ? (toNum(d._cum["외국인"]) + toNum(d._cum["기타외국인"])) : 0))) / unitScale} 
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">💡 전문가 팁</p>
              <p className="text-xs text-amber-700">
                • 외국인과 기관이 동시에 매수하면 강한 상승 신호<br/>
                • 개인 매도 + 기관 매수 = 기관의 저가 매집 가능성<br/>
                • 누적 수급이 divergence를 보이면 추세 전환 임박
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}