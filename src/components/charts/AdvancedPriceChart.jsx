import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Activity, Info, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { fmtDate } from "../../utils/dataUtils";
import { CHART_COLORS } from "../../constants/chartColors";
import { 
  calculateSMA, 
  calculateBollingerBands, 
  calculateRSI,
  calculateSignalScore 
} from "../../utils/technicalIndicators";

export default function AdvancedPriceChart({ data, onChartClick }) {
  // 기술적 지표 계산
  const enhancedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const ma20 = calculateSMA(data, 20);
    const ma60 = calculateSMA(data, 60);
    const ma120 = calculateSMA(data, 120);
    const bb = calculateBollingerBands(data, 20, 2);
    const rsi = calculateRSI(data, 14);
    
    return data.map((d, i) => ({
      ...d,
      ma20: ma20[i],
      ma60: ma60[i],
      ma120: ma120[i],
      bbUpper: bb[i].upper,
      bbMiddle: bb[i].middle,
      bbLower: bb[i].lower,
      rsi14: rsi[i],
    }));
  }, [data]);
  
  const latest = enhancedData[enhancedData.length - 1] || {};
  const prevClose = enhancedData[enhancedData.length - 2]?.close || latest.close;
  const priceChange = latest.close - prevClose;
  const priceChangePercent = (priceChange / prevClose * 100).toFixed(2);
  
  // 종합 신호 점수 계산
  const signalAnalysis = useMemo(() => {
    if (data.length < 20 || enhancedData.length === 0) return { score: 0, signals: [] };
    // enhancedData를 직접 사용 (이미 data의 모든 속성을 포함함)
    return calculateSignalScore(enhancedData, enhancedData.length - 1);
  }, [data, enhancedData]);
  
  // 신호 점수에 따른 색상과 메시지
  const getSignalStatus = (score) => {
    if (score >= 50) return { color: 'text-green-600', bg: 'bg-green-50', message: '강한 매수', icon: TrendingUp };
    if (score >= 20) return { color: 'text-green-500', bg: 'bg-green-50', message: '매수 고려', icon: TrendingUp };
    if (score <= -50) return { color: 'text-red-600', bg: 'bg-red-50', message: '강한 매도', icon: TrendingDown };
    if (score <= -20) return { color: 'text-red-500', bg: 'bg-red-50', message: '매도 고려', icon: TrendingDown };
    return { color: 'text-gray-600', bg: 'bg-gray-50', message: '중립/관망', icon: AlertCircle };
  };
  
  const signalStatus = getSignalStatus(signalAnalysis.score);

  return (
    <TooltipProvider>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4"/>
              고급 가격 분석 차트
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p className="font-semibold mb-1">이동평균선 & 볼린저 밴드</p>
                  <div className="text-sm space-y-1">
                    <p>• <span className="text-green-600">20일선</span>: 단기 추세</p>
                    <p>• <span className="text-amber-600">60일선</span>: 중기 추세</p>
                    <p>• <span className="text-red-600">120일선</span>: 장기 추세</p>
                    <p>• <span className="text-rose-600">볼린저 밴드</span>: 변동성 구간</p>
                  </div>
                  <p className="text-xs mt-2 text-gray-600">
                    정배열(20&gt;60&gt;120): 상승 추세<br/>
                    역배열(20&lt;60&lt;120): 하락 추세
                  </p>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 종합 신호 점수 */}
          <div className={`mb-4 p-4 rounded-lg ${signalStatus.bg}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <signalStatus.icon className={`w-5 h-5 ${signalStatus.color}`} />
                <h3 className={`font-semibold ${signalStatus.color}`}>
                  종합 매매 신호: {signalStatus.message}
                </h3>
              </div>
              <div className={`text-2xl font-bold ${signalStatus.color}`}>
                {signalAnalysis.score > 0 ? '+' : ''}{signalAnalysis.score}점
              </div>
            </div>
            {signalAnalysis.signals.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {signalAnalysis.signals.map((signal, idx) => (
                  <div key={idx} className="text-xs">
                    <span className={signal.type === 'bullish' ? 'text-green-600' : 'text-red-600'}>
                      {signal.name} ({signal.weight > 0 ? '+' : ''}{signal.weight})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 차트 */}
          <div className="h-96">
            <ResponsiveContainer>
              <ComposedChart data={enhancedData} onClick={onChartClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, "auto"]} />
                <RechartsTooltip 
                  formatter={(v, name) => {
                    if (typeof v === "number") {
                      if (name === "거래량") return [v.toLocaleString() + "주", name];
                      return [v.toFixed(0) + "원", name];
                    }
                    return v;
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                
                {/* 볼린저 밴드 (Area) */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="none"
                  fill={CHART_COLORS.bollingerUpper}
                  fillOpacity={0.1}
                  stackId="1"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey={(d) => d.bbLower ? d.bbUpper - d.bbLower : null}
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  stackId="1"
                />
                
                {/* 볼린저 밴드 라인 */}
                <Line yAxisId="left" type="monotone" dataKey="bbUpper" name="BB 상단" dot={false} stroke={CHART_COLORS.bollingerUpper} strokeWidth={1} strokeDasharray="3 3" />
                <Line yAxisId="left" type="monotone" dataKey="bbLower" name="BB 하단" dot={false} stroke={CHART_COLORS.bollingerLower} strokeWidth={1} strokeDasharray="3 3" />
                
                {/* 이동평균선 */}
                <Line yAxisId="left" type="monotone" dataKey="ma20" name="MA20" dot={false} stroke={CHART_COLORS.ma20} strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="ma60" name="MA60" dot={false} stroke={CHART_COLORS.ma60} strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="ma120" name="MA120" dot={false} stroke={CHART_COLORS.ma120} strokeWidth={2} />
                
                {/* 종가 */}
                <Line yAxisId="left" type="monotone" dataKey="close" name="종가" dot={false} stroke={CHART_COLORS.price} strokeWidth={2} />
                
                {/* VWAP */}
                <Line yAxisId="left" type="monotone" dataKey="avwap" name="VWAP" dot={false} stroke={CHART_COLORS.vwap} strokeWidth={2} strokeDasharray="5 5" />
                
                {/* 거래량 */}
                <Bar dataKey="volume" name="거래량" yAxisId="right" opacity={0.3} fill={CHART_COLORS.volume} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 기술적 지표 현황 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">MA20</p>
              <p className="text-sm font-bold">{latest.ma20?.toFixed(0)}원</p>
              <p className={`text-xs ${latest.close > latest.ma20 ? 'text-green-600' : 'text-red-600'}`}>
                {latest.close > latest.ma20 ? '▲ 위' : '▼ 아래'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">BB 위치</p>
              <p className="text-sm font-bold">
                {latest.bbUpper && latest.bbLower ? 
                  `${(((latest.close - latest.bbLower) / (latest.bbUpper - latest.bbLower)) * 100).toFixed(0)}%` : 
                  'N/A'
                }
              </p>
              <p className="text-xs text-gray-500">0%=하단, 100%=상단</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">RSI(14)</p>
              <p className="text-sm font-bold">{latest.rsi14?.toFixed(0)}</p>
              <p className={`text-xs ${
                latest.rsi14 > 70 ? 'text-red-600' : 
                latest.rsi14 < 30 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {latest.rsi14 > 70 ? '과매수' : latest.rsi14 < 30 ? '과매도' : '중립'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">추세</p>
              <p className="text-sm font-bold">
                {latest.ma20 > latest.ma60 && latest.ma60 > latest.ma120 ? '정배열' :
                 latest.ma20 < latest.ma60 && latest.ma60 < latest.ma120 ? '역배열' : '혼조'}
              </p>
              <p className={`text-xs ${
                latest.ma20 > latest.ma60 ? 'text-green-600' : 'text-red-600'
              }`}>
                {latest.ma20 > latest.ma60 ? '상승' : '하락'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}