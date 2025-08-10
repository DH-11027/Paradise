import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { fmtDate } from "../../utils/dataUtils";
import { INDICATOR_DESCRIPTIONS } from "../../constants/indicatorDescriptions";

export default function EnhancedIndicatorsChart({ data }) {
  const latest = data[data.length - 1] || {};
  
  // MFI 시그널 판단
  const getMFISignal = (mfi) => {
    if (mfi > 80) return { type: 'overbought', color: 'text-red-600', text: '과매수 구간', icon: AlertTriangle };
    if (mfi < 20) return { type: 'oversold', color: 'text-green-600', text: '과매도 구간', icon: CheckCircle };
    return { type: 'neutral', color: 'text-gray-600', text: '중립 구간', icon: null };
  };

  const mfiSignal = getMFISignal(latest.mfi14);

  return (
    <TooltipProvider>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            기술적 지표 분석
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{INDICATOR_DESCRIPTIONS.MFI.name}</p>
                    <p className="text-sm">{INDICATOR_DESCRIPTIONS.MFI.expert}</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold">{INDICATOR_DESCRIPTIONS.ATR.name}</p>
                    <p className="text-sm">{INDICATOR_DESCRIPTIONS.ATR.expert}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 현재 지표 상태 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">MFI(14)</span>
                {mfiSignal.icon && <mfiSignal.icon className={`w-4 h-4 ${mfiSignal.color}`} />}
              </div>
              <p className="text-xl font-bold">{latest.mfi14?.toFixed(1) || "N/A"}</p>
              <p className={`text-sm ${mfiSignal.color}`}>{mfiSignal.text}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">ATR(14)</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">포지션 사이징 공식</p>
                    <p className="text-xs">{INDICATOR_DESCRIPTIONS.ATR.signal.positionSize}</p>
                    <p className="text-xs mt-1">{INDICATOR_DESCRIPTIONS.ATR.signal.stopLoss}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{latest.atr14?.toFixed(0) || "N/A"}원</p>
              <p className="text-sm text-gray-600">일일 변동폭</p>
            </div>
          </div>

          {/* 차트 */}
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="mfi" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="atr" orientation="right" tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(v, name) => {
                    if (typeof v === "number") {
                      if (name === "ATR(14)") return [v.toFixed(0) + "원", name];
                      return [v.toFixed(1), name];
                    }
                    return v;
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                
                {/* MFI */}
                <Line yAxisId="mfi" type="monotone" dataKey="mfi14" name="MFI(14)" dot={false} stroke="#8b5cf6" strokeWidth={2} />
                
                {/* MFI 과매수/과매도 구간 */}
                <ReferenceLine yAxisId="mfi" y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "과매수", position: "right", style: { fontSize: 12 } }} />
                <ReferenceLine yAxisId="mfi" y={20} stroke="#16a34a" strokeDasharray="4 4" label={{ value: "과매도", position: "right", style: { fontSize: 12 } }} />
                
                {/* ATR */}
                <Line yAxisId="atr" type="monotone" dataKey="atr14" name="ATR(14)" dot={false} stroke="#f59e0b" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 매매 시그널 */}
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1">💡 MFI 매매 시그널</p>
              <p className="text-xs text-blue-700">
                • 매수: {INDICATOR_DESCRIPTIONS.MFI.signal.buy}<br/>
                • 매도: {INDICATOR_DESCRIPTIONS.MFI.signal.sell}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <span className="font-semibold">기관 팁:</span> {INDICATOR_DESCRIPTIONS.MFI.signal.institutional}
              </p>
            </div>
            
            {latest.atr14 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">📊 ATR 기반 리스크 관리</p>
                <p className="text-xs text-amber-700">
                  • 권장 손절가: {(latest.close - 2 * latest.atr14).toFixed(0)}원 (2 ATR)<br/>
                  • 목표가: {(latest.close + 3 * latest.atr14).toFixed(0)}원 (3 ATR)<br/>
                  • 리스크/리워드: 1:1.5
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}