import React, { useMemo } from "react";
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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Info, BarChart3, TrendingUp } from "lucide-react";

export default function VolumeProfileChart({ data }) {
  // 거래량 프로파일 계산
  const volumeProfile = useMemo(() => {
    if (!data || data.length === 0) return { 
      profile: [], 
      poc: 0, 
      valueArea: { low: 0, high: 0 } 
    };
    
    // 가격 범위 계산
    const prices = data.flatMap(d => [d.high, d.low]).filter(p => p != null && !isNaN(p));
    if (prices.length === 0) return { 
      profile: [], 
      poc: 0, 
      valueArea: { low: 0, high: 0 } 
    };
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const binSize = priceRange / 20; // 20개 구간으로 나눔
    
    // 각 가격대별 거래량 집계
    const bins = {};
    for (let i = 0; i < 20; i++) {
      const binStart = minPrice + (i * binSize);
      const binEnd = binStart + binSize;
      bins[i] = {
        price: (binStart + binEnd) / 2,
        priceRange: `${Math.floor(binStart)}-${Math.floor(binEnd)}`,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
      };
    }
    
    // 거래량 분배
    data.forEach(d => {
      if (!d.high || !d.low || !d.volume || isNaN(d.high) || isNaN(d.low) || isNaN(d.volume)) return;
      
      // 간단히 고가와 저가 사이에 거래량 균등 분배
      const highBin = Math.min(19, Math.max(0, Math.floor((d.high - minPrice) / binSize)));
      const lowBin = Math.min(19, Math.max(0, Math.floor((d.low - minPrice) / binSize)));
      
      for (let i = lowBin; i <= highBin && i < 20; i++) {
        const volumePerBin = d.volume / (highBin - lowBin + 1);
        bins[i].volume += volumePerBin;
        
        // 상승일은 매수, 하락일은 매도로 간주
        if (d.close > d.open) {
          bins[i].buyVolume += volumePerBin;
        } else {
          bins[i].sellVolume += volumePerBin;
        }
      }
    });
    
    // 배열로 변환하고 정렬
    const profile = Object.values(bins).sort((a, b) => a.price - b.price);
    
    // POC (Point of Control) - 가장 많은 거래량이 발생한 가격대
    const poc = profile.length > 0 ? 
      profile.reduce((max, bin) => bin.volume > max.volume ? bin : max, profile[0]) :
      { price: 0, volume: 0 };
    
    // Value Area (전체 거래량의 70%가 발생한 구간)
    const totalVolume = profile.reduce((sum, bin) => sum + bin.volume, 0);
    const targetVolume = totalVolume * 0.7;
    
    // POC를 중심으로 확장하며 Value Area 찾기
    const pocIndex = profile.findIndex(bin => bin === poc);
    let valueAreaVolume = poc.volume;
    let vahIndex = pocIndex; // Value Area High
    let valIndex = pocIndex; // Value Area Low
    
    while (valueAreaVolume < targetVolume && (vahIndex < profile.length - 1 || valIndex > 0)) {
      const upVolume = vahIndex < profile.length - 1 ? profile[vahIndex + 1].volume : 0;
      const downVolume = valIndex > 0 ? profile[valIndex - 1].volume : 0;
      
      if (upVolume >= downVolume && vahIndex < profile.length - 1) {
        vahIndex++;
        valueAreaVolume += upVolume;
      } else if (valIndex > 0) {
        valIndex--;
        valueAreaVolume += downVolume;
      }
    }
    
    return {
      profile,
      poc: poc.price || 0,
      valueArea: {
        high: profile[vahIndex]?.price || 0,
        low: profile[valIndex]?.price || 0,
      }
    };
  }, [data]);
  
  const latest = data[data.length - 1] || {};
  const currentPricePosition = latest.close && volumeProfile.valueArea.high !== volumeProfile.valueArea.low ? 
    ((latest.close - volumeProfile.valueArea.low) / 
     (volumeProfile.valueArea.high - volumeProfile.valueArea.low) * 100).toFixed(0) : 0;

  return (
    <TooltipProvider>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4"/>
            거래량 프로파일 분석
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-1">Volume Profile</p>
                <p className="text-sm mb-2">
                  각 가격대별 누적 거래량을 시각화합니다. POC는 가장 많은 거래가 일어난 가격대이며, 강력한 지지/저항선으로 작용합니다.
                </p>
                <div className="text-xs space-y-1">
                  <p>• <span className="font-semibold">POC</span>: 최대 거래 발생 가격</p>
                  <p>• <span className="font-semibold">Value Area</span>: 전체 거래의 70% 구간</p>
                  <p>• <span className="text-red-600">빨간색</span>: 매수 우세</p>
                  <p>• <span className="text-blue-600">파란색</span>: 매도 우세</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 현재 가격 위치 */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">현재가</p>
              <p className="text-sm font-bold">{latest.close?.toLocaleString()}원</p>
              <p className="text-xs text-gray-500">
                VA 내 위치: {currentPricePosition}%
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-gray-600">POC (핵심가격)</p>
              <p className="text-sm font-bold">{volumeProfile.poc ? volumeProfile.poc.toFixed(0) : '0'}원</p>
              <p className={`text-xs ${latest.close > volumeProfile.poc ? 'text-green-600' : 'text-red-600'}`}>
                현재가 {latest.close > volumeProfile.poc ? '위' : '아래'}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Value Area</p>
              <p className="text-sm font-bold">
                {volumeProfile.valueArea.low ? volumeProfile.valueArea.low.toFixed(0) : '0'}-{volumeProfile.valueArea.high ? volumeProfile.valueArea.high.toFixed(0) : '0'}
              </p>
              <p className="text-xs text-gray-500">70% 거래구간</p>
            </div>
          </div>

          {/* 거래량 프로파일 차트 */}
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart 
                data={volumeProfile.profile} 
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="volume" tick={{ fontSize: 12 }} />
                <YAxis dataKey="price" domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(v, name) => {
                    if (typeof v === "number") {
                      if (name.includes("거래량")) return [v.toLocaleString() + "주", name];
                      return [v.toFixed(0) + "원", name];
                    }
                    return v;
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                
                {/* 거래량 바 */}
                <Bar dataKey="volume" name="총 거래량">
                  {volumeProfile.profile.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.buyVolume > entry.sellVolume ? '#dc2626' : '#2563eb'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
                
                {/* 현재가 라인 */}
                {latest.close && (
                  <Line
                    type="monotone"
                    dataKey={() => latest.close}
                    stroke="#16a34a"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="현재가"
                    dot={false}
                  />
                )}
                
                {/* POC 라인 */}
                <Line
                  type="monotone"
                  dataKey={() => volumeProfile.poc}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="POC"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 매매 전략 팁 */}
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-xs font-semibold text-purple-800 mb-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              거래량 프로파일 활용 전략
            </p>
            <div className="text-xs text-purple-700 space-y-1">
              <p>• POC 근처에서는 강한 지지/저항 예상</p>
              <p>• Value Area 이탈 시 추세 가속화 가능성</p>
              <p>• 거래량 희박 구간은 빠른 가격 변동 예상</p>
              <p>• 매수 우세 구간 위 = 추가 상승 여력</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}