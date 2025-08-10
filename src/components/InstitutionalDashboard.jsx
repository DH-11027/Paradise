import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AlertTriangle, TrendingUp, DollarSign, Shield, Info, BarChart3, Activity, Target, AlertCircle } from "lucide-react";
import { RISK_INDICATORS } from "../constants/indicatorDescriptions";
import { 
  calculateInstitutionalSmartMoneyScore, 
  calculateInstitutionalTradingSignal,
  detectMarketRegime,
  calculateOptimalPositionSize,
  backtestSignalPerformance
} from "../utils/institutionalAnalytics";

export default function InstitutionalDashboard({ data, unitScale }) {
  // 포트폴리오 가정 금액 (예시)
  const FUND_SIZE = 100000000; // 1억원
  const latestIndex = data.length - 1;
  const latest = useMemo(() => data[latestIndex] || {}, [data, latestIndex]);
  
  // Advanced Analytics Calculations
  const smartMoneyScore = useMemo(() => {
    if (!data || data.length < 10) return { score: 50, breakdown: {}, interpretation: '데이터 부족' };
    return calculateInstitutionalSmartMoneyScore(data, latestIndex);
  }, [data, latestIndex]);
  
  const tradingSignal = useMemo(() => {
    if (!data || data.length < 10) return { 
      signal: 0, 
      factors: [], 
      positionSize: {},
      recommendation: { action: 'WAIT', description: '데이터 수집 중' },
      confidence: 0
    };
    return calculateInstitutionalTradingSignal(data, latestIndex) || {
      signal: 0,
      factors: [],
      positionSize: {},
      recommendation: { action: 'WAIT', description: '분석 중' },
      confidence: 0
    };
  }, [data, latestIndex]);
  
  const marketRegime = useMemo(() => {
    if (!data || data.length < 10) return 'UNKNOWN';
    return detectMarketRegime(data, latestIndex);
  }, [data, latestIndex]);
  
  const optimalPosition = useMemo(() => {
    if (!data || data.length < 10) return { size: 0, leverage: 1, reasoning: ['데이터 부족'] };
    return calculateOptimalPositionSize(data, latestIndex, FUND_SIZE);
  }, [data, latestIndex]);
  
  const signalBacktest = useMemo(() => {
    if (data.length < 100) return null;
    return backtestSignalPerformance(data);
  }, [data]);

  // 리스크 계산
  const calculations = useMemo(() => {
    if (!data || data.length < 10) return {};

    // 변동성 계산 (20일)
    const returns = [];
    for (let i = 1; i < Math.min(data.length, 21); i++) {
      const ret = (data[i].close - data[i-1].close) / data[i-1].close;
      returns.push(ret);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // 연율화

    // VaR 계산 (95% 신뢰수준)
    const dailyVaR = volatility / Math.sqrt(252) * 1.65;
    
    // 일평균 거래대금 (최근 20일)
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + (d.close * d.volume), 0) / 20;
    
    // 최대 안전 거래 가능 금액 (일평균의 5%)
    const safeTradeSize = avgVolume * 0.05;
    
    // 현재 포지션 가정 (전체 펀드의 0.1%)
    const positionSize = FUND_SIZE * 0.001;
    const positionVaR = positionSize * dailyVaR;

    return {
      volatility: volatility * 100,
      dailyVaR: dailyVaR * 100,
      positionVaR,
      avgVolume,
      safeTradeSize,
      positionSize,
      sharpeRatio: avgReturn > 0 ? (avgReturn * 252) / volatility : 0
    };
  }, [data]);

  // Removed unused flowScore calculation as it's now replaced by smartMoneyScore

  const formatKRW = (num) => {
    const safeNum = Number(num ?? 0);
    const absNum = Math.abs(safeNum);
    if (absNum >= 1000000000000) return `${(safeNum / 1000000000000).toFixed(1)}조원`;
    if (absNum >= 100000000) return `${(safeNum / 100000000).toFixed(1)}억원`;
    if (absNum >= 10000) return `${(safeNum / 10000).toFixed(0)}만원`;
    return `${safeNum.toLocaleString()}원`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            AI 투자 분석 대시보드
          </h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              marketRegime === 'BULL_TRENDING' ? 'bg-green-100 text-green-800' :
              marketRegime === 'BEAR_TRENDING' ? 'bg-red-100 text-red-800' :
              marketRegime === 'HIGH_VOLATILITY' ? 'bg-orange-100 text-orange-800' :
              marketRegime === 'RANGE_BOUND' ? 'bg-gray-100 text-gray-800' :
              marketRegime === 'BREAKOUT_POTENTIAL' ? 'bg-purple-100 text-purple-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              시장 상태: {marketRegime === 'BULL_TRENDING' ? '상승 추세' :
                      marketRegime === 'BEAR_TRENDING' ? '하락 추세' :
                      marketRegime === 'HIGH_VOLATILITY' ? '고변동성' :
                      marketRegime === 'RANGE_BOUND' ? '횡보 구간' :
                      marketRegime === 'BREAKOUT_POTENTIAL' ? '돌파 가능' :
                      marketRegime === 'TRANSITIONING' ? '전환기' : '분석 중'}
            </span>
          </div>
        </div>
        
        {/* 핵심 투자 신호 카드 */}
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">🎯 투자 결정 가이드</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* 단순 명확한 투자 결정 */}
            <div className="mb-6 p-4 bg-white rounded-lg border-2 border-gray-200">
              <h3 className="text-lg font-bold mb-3 text-center">
                현재 투자 추천: 
                <span className={`ml-2 ${
                  (tradingSignal?.signal || 0) > 40 ? 'text-green-600' :
                  (tradingSignal?.signal || 0) > 15 ? 'text-green-500' :
                  (tradingSignal?.signal || 0) > -15 ? 'text-yellow-600' :
                  (tradingSignal?.signal || 0) > -40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {(tradingSignal?.signal || 0) > 40 ? '🟢 매수' :
                   (tradingSignal?.signal || 0) > 15 ? '🟢 분할 매수' :
                   (tradingSignal?.signal || 0) > -15 ? '🟡 관망' :
                   (tradingSignal?.signal || 0) > -40 ? '🟠 비중 축소' :
                   '🔴 매도'}
                </span>
              </h3>
              <p className="text-center text-sm text-gray-600">
                {tradingSignal.recommendation?.description || '데이터 분석 중...'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 종합 매매 신호 */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <h3 className="text-sm font-medium text-gray-600 mb-2 cursor-help">
                      종합 매매 신호 ⓘ
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">종합 매매 신호란?</p>
                    <p className="text-sm">-100(강력 매도) ~ +100(강력 매수)</p>
                    <p className="text-sm mt-1">+40 이상: 매수 추천</p>
                    <p className="text-sm">-40 이하: 매도 추천</p>
                    <p className="text-sm">-15 ~ +15: 관망 구간</p>
                  </TooltipContent>
                </Tooltip>
                <div className={`text-4xl font-bold mb-2 ${
                  (tradingSignal?.signal || 0) > 30 ? 'text-green-600' :
                  (tradingSignal?.signal || 0) < -30 ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {(tradingSignal?.signal ?? 0).toFixed(0)}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                  (tradingSignal?.signal || 0) > 40 ? 'bg-green-600 text-white' :
                  (tradingSignal?.signal || 0) > 15 ? 'bg-green-500 text-white' :
                  (tradingSignal?.signal || 0) > -15 ? 'bg-yellow-500 text-white' :
                  (tradingSignal?.signal || 0) > -40 ? 'bg-orange-500 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {(tradingSignal?.signal || 0) > 40 ? '매수' :
                   (tradingSignal?.signal || 0) > 15 ? '분할매수' :
                   (tradingSignal?.signal || 0) > -15 ? '관망' :
                   (tradingSignal?.signal || 0) > -40 ? '비중축소' :
                   '매도'}
                </div>
              </div>
              
              {/* 스마트머니 점수 */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <h3 className="text-sm font-medium text-gray-600 mb-2 cursor-help">
                      스마트머니 점수 ⓘ
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">스마트머니 점수란?</p>
                    <p className="text-sm">기관+외국인의 수급 강도를 분석</p>
                    <p className="text-sm mt-1">80 이상: 기관 대량 매집</p>
                    <p className="text-sm">65 이상: 스마트머니 매수 우위</p>
                    <p className="text-sm">35 이하: 스마트머니 이탈</p>
                    <p className="text-sm">20 이하: 기관 대량 매도</p>
                  </TooltipContent>
                </Tooltip>
                <div className={`text-4xl font-bold mb-2 ${
                  smartMoneyScore.score > 65 ? 'text-blue-600' :
                  smartMoneyScore.score < 35 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {smartMoneyScore.score?.toFixed(0) || 0}
                </div>
                <p className="text-xs text-gray-600 px-2">
                  {smartMoneyScore.interpretation}
                </p>
              </div>
              
              {/* 추천 포지션 */}
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <h3 className="text-sm font-medium text-gray-600 mb-2 cursor-help">
                      최적 포지션 크기 ⓘ
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">포지션 크기란?</p>
                    <p className="text-sm">Kelly Criterion 기반 계산</p>
                    <p className="text-sm">변동성과 승률을 고려한 최적 투자금</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {formatKRW(optimalPosition.size)}
                </div>
                <p className="text-xs text-gray-600">
                  레버리지: {optimalPosition.leverage}x
                </p>
                <p className="text-xs text-gray-500">
                  {tradingSignal.recommendation?.targetAllocation || '포트폴리오의 5-10%'}
                </p>
              </div>
            </div>
            
            {/* 신호 신뢰도 */}
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">신호 신뢰도</span>
                <span className="text-sm font-bold">
                  {tradingSignal.confidence || tradingSignal.recommendation?.confidence || '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${tradingSignal.confidence || 0}%` }}
                />
              </div>
            </div>
            
            {/* 기간별 해석 가이드 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                <Info className="w-4 h-4" />
                기간별 점수 해석 가이드
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                • <strong>30일/60일</strong>: 단기 수급 흐름 반영, 단기 투자에 적합<br/>
                • <strong>120일</strong>: 중기 추세 반영, 스윙 트레이딩에 적합<br/>
                • <strong>240일</strong>: 장기 투자 관점, 큰 그림 파악에 유용<br/>
                • 기간이 길수록 노이즈가 줄고 신뢰도가 높아집니다
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Signal Factors Breakdown */}
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Activity className="w-5 h-5" />
              세부 분석 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tradingSignal.factors?.map((factor, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Weight: {(factor.weight * 100).toFixed(0)}%</p>
                        {factor.description && <p>{factor.description}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          factor.value > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, Math.abs(factor.value))}%`,
                          marginLeft: factor.value < 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold min-w-[3rem] text-right ${
                      factor.value > 0 ? 'text-green-600' : 
                      factor.value < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {typeof factor.value === 'number' ? factor.value.toFixed(0) : factor.value}
                    </span>
                  </div>
                  {factor.phase && (
                    <p className="text-xs text-gray-500 mt-1">{factor.phase}</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Backtest Performance */}
            {signalBacktest && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  신호 성과 (최근 60일)
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">정확도:</span>
                    <p className="font-bold text-lg">{signalBacktest.winRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">총 신호:</span>
                    <p className="font-bold text-lg">{signalBacktest.totalTrades}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">성공:</span>
                    <p className="font-bold text-lg">
                      {Math.round((parseFloat(signalBacktest.winRate) || 0) / 100 * (signalBacktest.totalTrades || 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 리스크 관리 대시보드 */}
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Shield className="w-5 h-5" />
              리스크 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* VaR */}
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">일일 VaR</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">{RISK_INDICATORS.VaR.name}</p>
                      <p>{RISK_INDICATORS.VaR.expert}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {calculations.dailyVaR?.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-600">
                  포지션 VaR: {formatKRW(calculations.positionVaR || 0)}
                </p>
              </div>

              {/* 유동성 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">유동성 분석</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">{RISK_INDICATORS.LIQUIDITY.name}</p>
                      <p>{RISK_INDICATORS.LIQUIDITY.expert}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm">일평균 거래대금</p>
                <p className="text-xl font-bold">{formatKRW(calculations.avgVolume || 0)}</p>
                <p className="text-sm text-blue-600 mt-1">
                  안전 거래 한도: {formatKRW(calculations.safeTradeSize || 0)}
                </p>
              </div>

              {/* 샤프 비율 */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">샤프 비율</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">{RISK_INDICATORS.SHARPE.name}</p>
                      <p>{RISK_INDICATORS.SHARPE.expert}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {calculations.sharpeRatio?.toFixed(2) || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  {calculations.sharpeRatio > 2 ? "우수" : 
                   calculations.sharpeRatio > 1 ? "양호" : 
                   calculations.sharpeRatio > 0.5 ? "보통" : "미흡"}
                </p>
              </div>
            </div>

            {/* 리스크 경고 */}
            {calculations.dailyVaR > 3 && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 font-medium">
                  경고: 높은 변동성 감지. 포지션 축소를 검토하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 스마트머니 수급 분석 */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <DollarSign className="w-5 h-5" />
              스마트머니 수급 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 스마트머니 점수 구성 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <h3 className="font-semibold mb-3">점수 구성 항목</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(smartMoneyScore.breakdown || {}).map(([key, value]) => {
                    const labels = {
                      flowIntensity: '수급 강도',
                      persistence: '지속성',
                      retailDivergence: '개인 역행',
                      momentum: '누적 모멘텀',
                      volumeSignal: '거래량 신호',
                      institutionalPattern: '기관 패턴',
                      marketRegime: '시장 레짐'
                    };
                    return (
                      <div key={key} className="text-sm">
                        <span className="text-gray-600">
                          {labels[key] || key}:
                        </span>
                        <span className={`ml-2 font-bold ${
                          typeof value === 'number' && value > 0 ? 'text-green-600' : 
                          typeof value === 'number' && value < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {typeof value === 'number' ? value.toFixed(1) : value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 주체별 상세 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    스마트머니 (기관+외인)
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>정보력과 자금력을 갖춘 전문 투자자들</p>
                        <p className="mt-1 text-xs">파란색: 매도 / 빨간색: 매수</p>
                      </TooltipContent>
                    </Tooltip>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>외국인</span>
                      <span className={`font-bold ${(latest._flows?.외국인합계 || 0) > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {formatKRW(latest._flows?.외국인합계 || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>기관</span>
                      <span className={`font-bold ${(latest._flows?.기관합계 || 0) > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {formatKRW(latest._flows?.기관합계 || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    개인 투자자
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>개인 투자자들의 매매 현황</p>
                        <p className="mt-1 text-xs">스마트머니와 반대로 움직이면 긍정 신호</p>
                      </TooltipContent>
                    </Tooltip>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>순매수</span>
                      <span className={`font-bold ${(latest._flows?.개인 || 0) > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {formatKRW(latest._flows?.개인 || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 포지션 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              리스크 조정 포지션 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  최적 포지션 크기
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Kelly Criterion을 기반으로 계산</p>
                      <p>안전을 위해 1/4 Kelly 적용</p>
                    </TooltipContent>
                  </Tooltip>
                </h4>
                <p className="text-2xl font-bold text-green-700 mb-2">
                  {formatKRW(optimalPosition.size)}
                </p>
                <div className="space-y-1 text-xs text-gray-600">
                  {optimalPosition.reasoning?.map((reason, idx) => {
                    const koreanLabels = {
                      'Kelly Fraction': 'Kelly 비율',
                      'Volatility Adjustment': '변동성 조정',
                      'Win Rate': '승률',
                      'Risk-Adjusted Size': '리스크 조정 크기',
                      'Insufficient loss data': '손실 데이터 부족',
                      '최소 20일 데이터 필요': '최소 20일 데이터 필요'
                    };
                    let translatedReason = reason;
                    Object.entries(koreanLabels).forEach(([eng, kor]) => {
                      translatedReason = translatedReason.replace(eng, kor);
                    });
                    return <p key={idx}>• {translatedReason}</p>;
                  })}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  동적 리스크 관리
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>시장 상황과 변동성에 따라</p>
                      <p>리스크 한도가 자동 조정됩니다</p>
                    </TooltipContent>
                  </Tooltip>
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">손절선:</span>
                    <p className="font-bold text-red-600">
                      {tradingSignal.recommendation?.stopLoss || '진입가 -5%'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">목표 비중:</span>
                    <p className="font-bold text-orange-600">
                      {tradingSignal.recommendation?.targetAllocation || '5-10%'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">리스크 배수:</span>
                    <p className="font-bold">
                      {(tradingSignal?.riskMultiplier ?? 1).toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Risk Warnings */}
            {marketRegime === 'HIGH_VOLATILITY' && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  고변동성 감지. 포지션 크기가 자동으로 {((1 - (tradingSignal?.riskMultiplier ?? 0.7)) * 100).toFixed(0)}% 감소되었습니다.
                </p>
              </div>
            )}
            
            {calculations.dailyVaR > 4 && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  극단적 리스크 수준. 노출도를 줄이거나 헤지를 고려하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}