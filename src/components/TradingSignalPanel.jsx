import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Target, Shield, 
  DollarSign, Info, AlertCircle, CheckCircle, XCircle,
  BarChart3, Zap, Clock
} from 'lucide-react';
import { 
  generateTradingSignals, 
  detectAccumulationPattern,
  detectBreakoutPattern,
  detectReversalPattern,
  detectDistributionPattern,
  backtestSignalPerformance 
} from '../utils/institutionalAnalytics';

export default function TradingSignalPanel({ data }) {
  // 최신 매매 신호
  const latestSignals = useMemo(() => {
    if (!data || data.length < 10) return null;
    return generateTradingSignals(data, data.length - 1);
  }, [data]);
  
  // 패턴 감지
  const patterns = useMemo(() => {
    if (!data || data.length < 10) return {};
    const index = data.length - 1;
    const result = {
      accumulation: detectAccumulationPattern(data, index),
      breakout: detectBreakoutPattern(data, index),
      reversal: detectReversalPattern(data, index),
      distribution: detectDistributionPattern(data, index)
    };
    return result;
  }, [data]);
  
  // 백테스팅 결과
  const backtest = useMemo(() => {
    if (!data || data.length < 40) return null;
    return backtestSignalPerformance(data);
  }, [data]);
  
  const formatKRW = (num) => {
    const absNum = Math.abs(num);
    if (absNum >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (absNum >= 10000) return `${(num / 10000).toFixed(0)}만`;
    return num.toLocaleString();
  };
  
  const formatPrice = (price) => {
    return price ? price.toLocaleString() + '원' : 'N/A';
  };
  
  if (!data || data.length < 10) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            매매 신호 생성을 위해 최소 10일 데이터가 필요합니다.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const latest = data[data.length - 1];
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* 실시간 매매 신호 */}
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              💰 실시간 매매 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestSignals?.signals?.length > 0 ? (
              <div className="space-y-4">
                {latestSignals.signals.map((signal, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-2 ${
                    signal.type === 'BUY' ? 
                    'bg-green-50 border-green-300' : 
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {signal.type === 'BUY' ? (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        )}
                        <span className={`text-xl font-bold ${
                          signal.type === 'BUY' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {signal.type === 'BUY' ? '매수' : '매도'} 신호
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          signal.strength === 'STRONG' ? 
                          'bg-purple-100 text-purple-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {signal.strength === 'STRONG' ? '강력' : '보통'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">신뢰도</span>
                        <span className="text-lg font-bold">
                          {signal.confidence?.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-gray-700">
                        📌 {signal.reason}
                      </p>
                      
                      {signal.type === 'BUY' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div className="bg-white p-2 rounded">
                            <span className="text-xs text-gray-600">진입가</span>
                            <p className="font-bold text-green-600">
                              {formatPrice(signal.entry)}
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <span className="text-xs text-gray-600">손절가</span>
                            <p className="font-bold text-red-600">
                              {formatPrice(signal.stopLoss)}
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <span className="text-xs text-gray-600">1차목표</span>
                            <p className="font-bold text-blue-600">
                              {formatPrice(signal.target1)}
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <span className="text-xs text-gray-600">2차목표</span>
                            <p className="font-bold text-blue-600">
                              {formatPrice(signal.target2)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {signal.type === 'SELL' && (
                        <div className="mt-3 p-3 bg-white rounded">
                          <p className="font-medium text-red-700">
                            ⚠️ {signal.action}
                          </p>
                        </div>
                      )}
                      
                      {signal.riskReward && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-600">손익비</span>
                          <span className="font-bold text-purple-600">
                            1:{signal.riskReward.toFixed(1)}
                          </span>
                        </div>
                      )}
                      
                      {signal.warning && (
                        <p className="text-xs text-orange-600 mt-2">
                          ⚠️ {signal.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* 요약 */}
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-center">
                    {latestSignals.summary}
                  </p>
                  <p className="text-xs text-center text-gray-600 mt-1">
                    리스크 레벨: <span className={`font-bold ${
                      latestSignals.riskLevel === 'HIGH' ? 'text-red-600' :
                      latestSignals.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{latestSignals.riskLevel}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">현재 관망 구간</p>
                <p className="text-sm text-gray-500 mt-1">
                  명확한 매매 신호가 없습니다. 기다리세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 패턴 인식 결과 */}
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BarChart3 className="w-5 h-5" />
              패턴 인식 시스템
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(patterns).map(([name, pattern]) => (
                <div key={name} className={`p-3 rounded-lg border ${
                  pattern.detected ? 
                  'bg-purple-50 border-purple-300' : 
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {name === 'accumulation' ? '매집' :
                       name === 'breakout' ? '돌파' :
                       name === 'reversal' ? '반등' :
                       '분산'}
                    </span>
                    {pattern.detected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          pattern.detected ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${pattern.confidence || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">
                      {pattern.confidence?.toFixed(0) || 0}%
                    </span>
                  </div>
                  {pattern.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {pattern.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 백테스팅 성과 */}
        {backtest && (
          <Card className="border-2 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Target className="w-5 h-5" />
                시스템 성과 검증 (백테스팅)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">총 수익률</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(backtest.totalReturn) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {backtest.totalReturn}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">승률</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {backtest.winRate}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">손익비</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {backtest.profitFactor}
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">최대낙폭</p>
                  <p className="text-2xl font-bold text-orange-600">
                    -{backtest.maxDrawdown}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">총 거래 횟수:</span>
                  <span className="ml-2 font-bold">{backtest.totalTrades}회</span>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">샤프 비율:</span>
                  <span className="ml-2 font-bold">{backtest.sharpeRatio}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">평균 수익:</span>
                  <span className="ml-2 font-bold text-green-600">+{backtest.avgWin}%</span>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">평균 손실:</span>
                  <span className="ml-2 font-bold text-red-600">-{backtest.avgLoss}%</span>
                </div>
              </div>
              
              {/* 최근 거래 내역 */}
              {backtest.trades?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">최근 거래 내역</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {backtest.trades.map((trade, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-600">{trade.date}</span>
                        <span className={`font-medium ${
                          trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.type}
                        </span>
                        <span>{formatPrice(trade.price)}</span>
                        {trade.profit !== undefined && (
                          <span className={`font-bold ${
                            trade.profit > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 이 백테스팅은 과거 데이터 기반 시뮬레이션이며, 
                  실제 투자 결과와 다를 수 있습니다. 수수료 0.3% 적용.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 투자 가이드 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Shield className="w-5 h-5" />
              투자 실행 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-700 mb-1">✅ 매수 신호 시</p>
                <ul className="space-y-1 text-green-600 text-xs">
                  <li>• 제시된 진입가 근처에서 분할 매수</li>
                  <li>• 반드시 손절가 설정 (진입가 -5~7%)</li>
                  <li>• 전체 자산의 30% 이내로 제한</li>
                  <li>• 1차 목표가에서 50% 익절</li>
                </ul>
              </div>
              
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="font-medium text-red-700 mb-1">🛑 매도 신호 시</p>
                <ul className="space-y-1 text-red-600 text-xs">
                  <li>• 즉시 포지션 정리 또는 축소</li>
                  <li>• 분산 패턴 확인 시 전량 매도</li>
                  <li>• 손실 -5% 도달 시 무조건 손절</li>
                  <li>• 추가 매수 절대 금지</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="font-medium text-yellow-700 mb-1">⚠️ 리스크 관리</p>
                <ul className="space-y-1 text-yellow-600 text-xs">
                  <li>• 고변동성 시장: 포지션 50% 축소</li>
                  <li>• 연속 2회 손실 시: 1주일 휴식</li>
                  <li>• 월 최대 손실 한도: -10%</li>
                  <li>• 감정적 매매 절대 금지</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}