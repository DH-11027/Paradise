import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import { fmtDate } from "../../utils/dataUtils";
import { INDICATOR_DESCRIPTIONS } from "../../constants/indicatorDescriptions";

export default function EnhancedOBVFlowChart({ data, unitScale }) {
  const latest = data[data.length - 1] || {};
  const previous = data[data.length - 2] || {};
  
  // OBV 다이버전스 체크
  const checkDivergence = () => {
    if (data.length < 10) return null;
    
    const recentData = data.slice(-10);
    const priceChange = recentData[recentData.length - 1].close - recentData[0].close;
    const obvChange = recentData[recentData.length - 1].obv - recentData[0].obv;
    
    if (priceChange > 0 && obvChange < 0) {
      return { type: 'bearish', message: '약세 다이버전스 - 가격 상승하나 OBV 하락 (분산 신호)' };
    } else if (priceChange < 0 && obvChange > 0) {
      return { type: 'bullish', message: '강세 다이버전스 - 가격 하락하나 OBV 상승 (매집 신호)' };
    }
    return null;
  };

  const divergence = checkDivergence();

  return (
    <TooltipProvider>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            OBV & 누적 수급 분석
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{INDICATOR_DESCRIPTIONS.OBV.name}</p>
                    <p className="text-sm">{INDICATOR_DESCRIPTIONS.OBV.expert}</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold">{INDICATOR_DESCRIPTIONS.FLOW.name}</p>
                    <p className="text-sm">{INDICATOR_DESCRIPTIONS.FLOW.expert}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 다이버전스 알림 */}
          {divergence && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              divergence.type === 'bullish' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {divergence.type === 'bullish' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">{divergence.message}</span>
            </div>
          )}

          {/* 현재 상태 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">OBV 방향</span>
                {latest.obv > previous.obv ? 
                  <TrendingUp className="w-4 h-4 text-green-600" /> : 
                  <TrendingDown className="w-4 h-4 text-red-600" />
                }
              </div>
              <p className="text-sm">
                {latest.obv > previous.obv ? '매집' : '분산'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium block mb-1">외국인 누적</span>
              <p className={`text-sm font-bold ${latest.cumForeign > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {((latest.cumForeign || 0) / unitScale).toFixed(0)}{unitScale === 100000000 ? '억' : ''}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium block mb-1">기관 누적</span>
              <p className={`text-sm font-bold ${latest.cumInst > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {((latest.cumInst || 0) / unitScale).toFixed(0)}{unitScale === 100000000 ? '억' : ''}
              </p>
            </div>
          </div>

          {/* 차트 */}
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="obv" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <YAxis yAxisId="flow" orientation="right" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <RechartsTooltip 
                  formatter={(v, name) => {
                    if (typeof v === "number") {
                      if (name.includes("누적")) {
                        return [(v).toFixed(0) + (unitScale === 100000000 ? "억원" : "원"), name];
                      }
                      return [v.toLocaleString(), name];
                    }
                    return v;
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                
                <Area yAxisId="obv" type="monotone" dataKey="obv" name="OBV" dot={false} fillOpacity={0.2} stroke="#6366f1" fill="#6366f1" />
                <Line yAxisId="flow" type="monotone" dataKey={(d) => d.cumForeign / unitScale} name="누적 외국인(합계)" dot={false} strokeDasharray="5 2" stroke="#dc2626" strokeWidth={2} />
                <Line yAxisId="flow" type="monotone" dataKey={(d) => d.cumInst / unitScale} name="누적 기관합계" dot={false} strokeDasharray="2 5" stroke="#2563eb" strokeWidth={2} />
                <Line yAxisId="flow" type="monotone" dataKey={(d) => (d.cumPerson || 0) / unitScale} name="누적 개인" dot={false} strokeDasharray="3 3" stroke="#16a34a" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 매매 시그널 */}
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs font-semibold text-purple-800 mb-1">💡 OBV 매매 시그널</p>
              <p className="text-xs text-purple-700">
                • 매수: {INDICATOR_DESCRIPTIONS.OBV.signal.buy}<br/>
                • 매도: {INDICATOR_DESCRIPTIONS.OBV.signal.sell}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                <span className="font-semibold">기관 팁:</span> {INDICATOR_DESCRIPTIONS.OBV.signal.institutional}
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1">🎯 수급 분석 포인트</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <span className="font-semibold">외국인:</span> {INDICATOR_DESCRIPTIONS.FLOW.categories.외국인}</p>
                <p>• <span className="font-semibold">기관:</span> {INDICATOR_DESCRIPTIONS.FLOW.categories.기관}</p>
                <p>• <span className="font-semibold">개인:</span> {INDICATOR_DESCRIPTIONS.FLOW.categories.개인}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}