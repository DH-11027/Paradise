import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Activity, Info, TrendingUp, TrendingDown } from "lucide-react";
import { fmtDate } from "../../utils/dataUtils";
import { INDICATOR_DESCRIPTIONS } from "../../constants/indicatorDescriptions";

export default function EnhancedPriceVolumeChart({ data, onChartClick }) {
  const latest = data[data.length - 1] || {};
  const prevClose = data[data.length - 2]?.close || latest.close;
  const priceChange = latest.close - prevClose;
  const priceChangePercent = (priceChange / prevClose * 100).toFixed(2);

  // VWAP 시그널 판단
  const vwapSignal = latest.close > latest.avwap ? "bullish" : "bearish";

  return (
    <TooltipProvider>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4"/>
              가격/거래량 + Anchored VWAP
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">{INDICATOR_DESCRIPTIONS.VWAP.name}</p>
                  <p className="mb-2">
                    {INDICATOR_DESCRIPTIONS.VWAP.expert}
                  </p>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs font-semibold">매매 시그널:</p>
                    <p className="text-xs">• 매수: {INDICATOR_DESCRIPTIONS.VWAP.signal.buy}</p>
                    <p className="text-xs">• 매도: {INDICATOR_DESCRIPTIONS.VWAP.signal.sell}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{latest.close?.toLocaleString()}원</span>
                <span className={`flex items-center text-sm font-medium ${priceChange >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {priceChangePercent}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                VWAP: {latest.avwap?.toFixed(0)}원
                <span className={`ml-2 font-medium ${vwapSignal === 'bullish' ? 'text-red-600' : 'text-blue-600'}`}>
                  ({vwapSignal === 'bullish' ? '강세' : '약세'})
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart data={data} onClick={onChartClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, "auto"]} />
                <RechartsTooltip 
                  formatter={(v, name) => {
                    if (typeof v === "number") {
                      if (name === "거래량") return [v.toLocaleString() + "주", name];
                      return [v.toLocaleString() + "원", name];
                    }
                    return v;
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                
                {/* Close price */}
                <Line type="monotone" dataKey="close" name="종가" yAxisId="left" dot={false} strokeWidth={2} stroke="#2563eb" />
                
                {/* Anchored VWAP */}
                <Line type="monotone" dataKey="avwap" name="Anchored VWAP" yAxisId="left" dot={false} strokeDasharray="5 5" stroke="#dc2626" strokeWidth={2} />
                
                {/* VWAP 기준선 */}
                {latest.avwap && (
                  <ReferenceLine yAxisId="left" y={latest.avwap} stroke="#dc2626" strokeDasharray="3 3" opacity={0.5} />
                )}
                
                {/* Volume */}
                <Bar dataKey="volume" name="거래량" yAxisId="right" opacity={0.4} fill="#6366f1" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">💡 기관 투자자 팁:</span> {INDICATOR_DESCRIPTIONS.VWAP.signal.institutional}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              차트를 클릭하면 해당 지점으로 AVWAP 기준이 이동합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}