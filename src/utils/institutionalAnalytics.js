// =============================
// Institutional-Grade Analytics Module  
// Advanced Quantitative Trading Algorithms
// Real Money Making System v2.0
// =============================

import { toNum } from './dataUtils';

// Market Regime Detection
export function detectMarketRegime(data, index) {
  if (!data || index < 10) return 'UNKNOWN';
  
  // 사용 가능한 데이터 범위에 맞춰 조정
  const lookback20 = Math.min(20, index + 1);
  const lookback60 = Math.min(60, index + 1);
  
  const prev20 = data.slice(Math.max(0, index - lookback20 + 1), index + 1);
  const prev60 = data.slice(Math.max(0, index - lookback60 + 1), index + 1);
  
  // 1. Trend Analysis
  const ma20 = prev20.reduce((sum, d) => sum + d.close, 0) / prev20.length;
  const ma60 = prev60.reduce((sum, d) => sum + d.close, 0) / prev60.length;
  const currentPrice = data[index].close;
  
  const trendStrength = (currentPrice - ma60) / ma60;
  const momentum = (ma20 - ma60) / ma60;
  
  // 2. Volatility Regime
  const returns20 = [];
  for (let i = 1; i < prev20.length; i++) {
    returns20.push((prev20[i].close - prev20[i-1].close) / prev20[i-1].close);
  }
  const vol20 = Math.sqrt(returns20.reduce((sum, r) => sum + r*r, 0) / returns20.length) * Math.sqrt(252);
  
  // 3. Volume Regime
  const avgVol20 = prev20.reduce((sum, d) => sum + d.volume, 0) / prev20.length;
  const avgVol60 = prev60.reduce((sum, d) => sum + d.volume, 0) / prev60.length;
  const volumeTrend = (avgVol20 - avgVol60) / avgVol60;
  
  // Regime Classification
  if (trendStrength > 0.1 && momentum > 0.05 && vol20 < 0.3) {
    return 'BULL_TRENDING';
  } else if (trendStrength < -0.1 && momentum < -0.05) {
    return 'BEAR_TRENDING';
  } else if (vol20 > 0.4) {
    return 'HIGH_VOLATILITY';
  } else if (Math.abs(trendStrength) < 0.05 && vol20 < 0.2) {
    return 'RANGE_BOUND';
  } else if (volumeTrend > 0.5 && Math.abs(trendStrength) > 0.05) {
    return 'BREAKOUT_POTENTIAL';
  } else {
    return 'TRANSITIONING';
  }
}

// Advanced Order Flow Analysis
function analyzeOrderFlowImbalance(data, index) {
  if (!data || index < 5) return 0;
  
  const recent5 = data.slice(Math.max(0, index - 4), index + 1);
  let buyPressure = 0;
  let sellPressure = 0;
  
  recent5.forEach(d => {
    // VWAP 대비 종가 위치로 매수/매도 압력 추정
    const vwap = (d.high + d.low + d.close) / 3;
    const pressure = (d.close - vwap) / vwap;
    
    if (pressure > 0) {
      buyPressure += pressure * d.volume;
    } else {
      sellPressure += Math.abs(pressure) * d.volume;
    }
  });
  
  const totalPressure = buyPressure + sellPressure;
  if (totalPressure === 0) return 0;
  
  return (buyPressure - sellPressure) / totalPressure;
}

// Institutional Accumulation/Distribution Detection
function detectInstitutionalActivity(data, index) {
  if (!data || index < 20) return { phase: 'UNKNOWN', strength: 0 };
  
  const current = data[index];
  const prev20 = data.slice(Math.max(0, index - 20), index);
  
  // Volume-Price Analysis
  const avgVolume = prev20.reduce((sum, d) => sum + d.volume, 0) / prev20.length;
  const volumeRatio = current.volume / avgVolume;
  
  // Price Movement Analysis
  const priceChange = (current.close - prev20[0].close) / prev20[0].close;
  const dailyRange = (current.high - current.low) / current.close;
  
  // Flow Analysis
  const foreignFlow = toNum(current._flows?.외국인합계 || 0);
  const instFlow = toNum(current._flows?.기관합계 || 0);
  const smartMoney = foreignFlow + instFlow;
  
  // Pattern Recognition
  if (volumeRatio > 2 && smartMoney > 0 && dailyRange < 0.02) {
    return { phase: 'ACCUMULATION', strength: Math.min(100, volumeRatio * 25) };
  } else if (volumeRatio > 1.5 && smartMoney < 0 && priceChange < -0.01) {
    return { phase: 'DISTRIBUTION', strength: Math.min(100, volumeRatio * 20) };
  } else if (volumeRatio < 0.5 && Math.abs(priceChange) < 0.01) {
    return { phase: 'CONSOLIDATION', strength: 30 };
  } else if (smartMoney > 0 && priceChange > 0) {
    return { phase: 'MARKUP', strength: 50 };
  } else if (smartMoney < 0 && priceChange < 0) {
    return { phase: 'MARKDOWN', strength: 50 };
  }
  
  return { phase: 'NEUTRAL', strength: 0 };
}

// 기관급 스마트머니 점수 계산 (0-100 스케일)
export function calculateInstitutionalSmartMoneyScore(data, index) {
  // 최소 10일 데이터만 있으면 작동
  if (!data || index < 10 || index >= data.length) return { score: 50, breakdown: {}, interpretation: "데이터 부족" };
  
  const current = data[index];
  
  // 사용 가능한 데이터 범위에 맞춰 조정
  const lookback20 = Math.min(20, index);
  const lookback60 = Math.min(60, index);
  
  const prev20 = data.slice(Math.max(0, index - lookback20), index);
  const prev60 = data.slice(Math.max(0, index - lookback60), index);
  
  let breakdown = {};
  let totalScore = 0;
  
  // Market Regime Adjustment
  const marketRegime = detectMarketRegime(data, index);
  let regimeMultiplier = 1;
  switch(marketRegime) {
    case 'BULL_TRENDING': regimeMultiplier = 1.2; break;
    case 'BEAR_TRENDING': regimeMultiplier = 0.8; break;
    case 'HIGH_VOLATILITY': regimeMultiplier = 0.7; break;
    case 'BREAKOUT_POTENTIAL': regimeMultiplier = 1.3; break;
    default: regimeMultiplier = 1;
  }
  breakdown.marketRegime = marketRegime;
  
  // 1. Enhanced Flow Analysis with Order Flow Imbalance (30점)
  const foreignFlow = toNum(current._flows?.외국인합계 || 0);
  const instFlow = toNum(current._flows?.기관합계 || 0);
  const retailFlow = toNum(current._flows?.개인 || 0);
  const totalAbsFlow = Math.abs(foreignFlow) + Math.abs(instFlow) + Math.abs(retailFlow);
  
  if (totalAbsFlow > 0) {
    const smartMoneyNet = foreignFlow + instFlow;
    const flowIntensity = (smartMoneyNet / totalAbsFlow) * 20;
    
    // Order Flow Imbalance 추가
    const orderFlowImbalance = analyzeOrderFlowImbalance(data, index);
    const enhancedFlow = flowIntensity + (orderFlowImbalance * 10);
    
    breakdown.flowIntensity = Math.max(-30, Math.min(30, enhancedFlow));
    totalScore += breakdown.flowIntensity;
  }
  
  // 2. Multi-Timeframe Flow Persistence (25점)
  const recent5Days = data.slice(Math.max(0, index - 4), index + 1);
  const recent10Days = data.slice(Math.max(0, index - 9), index + 1);
  
  // Short-term persistence
  let shortTermScore = 0;
  let consecutiveDays = 0;
  let lastDirection = 0;
  
  recent5Days.forEach(d => {
    const daySmartMoney = toNum(d._flows?.외국인합계 || 0) + toNum(d._flows?.기관합계 || 0);
    const direction = daySmartMoney > 0 ? 1 : (daySmartMoney < 0 ? -1 : 0);
    
    if (direction === lastDirection && direction !== 0) {
      consecutiveDays++;
    } else {
      consecutiveDays = direction !== 0 ? 1 : 0;
    }
    lastDirection = direction;
  });
  
  shortTermScore = Math.min(15, consecutiveDays * 3 * lastDirection);
  
  // Long-term consistency
  const positiveDays = recent10Days.filter(d => {
    const flow = toNum(d._flows?.외국인합계 || 0) + toNum(d._flows?.기관합계 || 0);
    return flow > 0;
  }).length;
  
  const longTermScore = (positiveDays / recent10Days.length - 0.5) * 20;
  
  breakdown.persistence = shortTermScore + longTermScore;
  totalScore += breakdown.persistence;
  
  // 3. 개인 역행 지표 (15점)
  // 스마트머니와 개인의 반대 포지션 = 긍정 신호
  const smartTotal = foreignFlow + instFlow;
  if (smartTotal > 0 && retailFlow < 0) {
    breakdown.retailDivergence = 15;
  } else if (smartTotal < 0 && retailFlow > 0) {
    breakdown.retailDivergence = -15;
  } else {
    breakdown.retailDivergence = 0;
  }
  totalScore += breakdown.retailDivergence;
  
  // 4. 누적 수급 모멘텀 (15점)
  // 20일 vs 60일 누적 수급 비교
  const cum20 = prev20.reduce((sum, d) => {
    return sum + toNum(d._flows?.외국인합계 || 0) + toNum(d._flows?.기관합계 || 0);
  }, 0);
  
  const cum60 = prev60.reduce((sum, d) => {
    return sum + toNum(d._flows?.외국인합계 || 0) + toNum(d._flows?.기관합계 || 0);
  }, 0);
  
  if (prev60.length > 0) {
    const avg20 = cum20 / prev20.length;
    const avg60 = cum60 / prev60.length;
    const momentum = avg20 > avg60 ? 15 : (avg20 < avg60 * 0.5 ? -15 : 0);
    breakdown.momentum = momentum;
    totalScore += momentum;
  }
  
  // 5. 대량 거래 감지 (10점)
  // 평균 대비 3배 이상 거래량에서의 수급
  const avgVolume = prev20.reduce((sum, d) => sum + toNum(d.volume || 0), 0) / prev20.length;
  const isHighVolume = current.volume > avgVolume * 2.5;
  
  if (isHighVolume) {
    if (smartTotal > 0) {
      breakdown.volumeSignal = 10;
    } else if (smartTotal < 0) {
      breakdown.volumeSignal = -10;
    }
  } else {
    breakdown.volumeSignal = 0;
  }
  totalScore += breakdown.volumeSignal;
  
  // 6. Institutional Activity Pattern (20점)
  const instActivity = detectInstitutionalActivity(data, index);
  let instScore = 0;
  
  if (instActivity.phase === 'ACCUMULATION') {
    instScore = instActivity.strength * 0.2;
  } else if (instActivity.phase === 'DISTRIBUTION') {
    instScore = -instActivity.strength * 0.2;
  } else if (instActivity.phase === 'MARKUP' && foreignFlow > 0) {
    instScore = 15;
  } else if (instActivity.phase === 'MARKDOWN' && foreignFlow < 0) {
    instScore = -15;
  }
  
  // Foreign Leadership Premium
  if (foreignFlow > 0 && instFlow <= 0) {
    instScore += 5; // 외국인 단독 매수
  } else if (foreignFlow > 0 && instFlow > 0 && foreignFlow > instFlow * 1.5) {
    instScore += 10; // 외국인 주도 매수
  } else if (foreignFlow < 0 && instFlow >= 0) {
    instScore -= 5; // 외국인 단독 매도
  } else if (foreignFlow < 0 && instFlow < 0 && foreignFlow < instFlow * 1.5) {
    instScore -= 10; // 외국인 주도 매도
  }
  
  breakdown.institutionalPattern = Math.max(-20, Math.min(20, instScore));
  totalScore += breakdown.institutionalPattern;
  
  // Apply Market Regime Multiplier
  totalScore *= regimeMultiplier;
  
  // 정규화 (0-100 스케일)
  const normalizedScore = Math.max(0, Math.min(100, totalScore + 50));
  
  return {
    score: normalizedScore,
    breakdown,
    interpretation: getSmartMoneyInterpretation(normalizedScore)
  };
}

// Dynamic Risk-Adjusted Position Sizing
export function calculateOptimalPositionSize(data, index, portfolioValue = 100000000) {
  if (!data || index < 20) return { size: 0, leverage: 1, reasoning: ['최소 20일 데이터 필요'] };
  
  const prev20 = data.slice(Math.max(0, index - 20), index);
  const returns = [];
  
  for (let i = 1; i < prev20.length; i++) {
    returns.push((prev20[i].close - prev20[i-1].close) / prev20[i-1].close);
  }
  
  // Kelly Criterion Modified
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const winRate = returns.filter(r => r > 0).length / returns.length;
  const avgWin = returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / Math.max(1, returns.filter(r => r > 0).length);
  const avgLoss = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0) / Math.max(1, returns.filter(r => r < 0).length));
  
  if (avgLoss === 0) return { size: 0, leverage: 1, reasoning: ['Insufficient loss data'] };
  
  const kellyFraction = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
  const safeKelly = Math.max(0, Math.min(0.25, kellyFraction * 0.25)); // 1/4 Kelly for safety
  
  // Volatility Adjustment
  const vol = Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) * Math.sqrt(252);
  const volAdjustment = Math.max(0.5, Math.min(1, 0.2 / vol)); // Lower position for high vol
  
  // Liquidity Constraint
  const avgVolume = prev20.reduce((sum, d) => sum + d.volume * d.close, 0) / prev20.length;
  const maxPosition = avgVolume * 0.01; // Max 1% of daily volume
  
  const optimalSize = Math.min(
    portfolioValue * safeKelly * volAdjustment,
    maxPosition
  );
  
  const reasoning = [
    `Kelly Fraction: ${(kellyFraction * 100).toFixed(2)}%`,
    `Volatility Adjustment: ${(volAdjustment * 100).toFixed(0)}%`,
    `Win Rate: ${(winRate * 100).toFixed(1)}%`,
    `Risk-Adjusted Size: ${(safeKelly * 100).toFixed(2)}% of portfolio`
  ];
  
  return {
    size: Math.round(optimalSize),
    leverage: safeKelly > 0.15 ? 1.5 : 1,
    reasoning
  };
}

// Advanced Technical Signal Composite
function calculateAdvancedTechnicalSignal(data, index) {
  if (!data || index < 60) return 0;
  
  const current = data[index];
  let signal = 0;
  
  // 1. Momentum Quality (not just strength)
  const rsi = current.rsi14 || 50;
  const rsiPrev = data[index - 1]?.rsi14 || 50;
  const rsiSlope = rsi - rsiPrev;
  
  if (rsi < 30 && rsiSlope > 0) signal += 20; // Oversold reversal
  else if (rsi > 70 && rsiSlope < 0) signal -= 20; // Overbought reversal
  else if (rsi > 50 && rsi < 70 && rsiSlope > 0) signal += 10; // Healthy momentum
  else if (rsi < 50 && rsi > 30 && rsiSlope < 0) signal -= 10; // Weakening
  
  // 2. MACD Histogram Acceleration
  if (current.macdHistogram && data[index - 1]?.macdHistogram) {
    const histAccel = current.macdHistogram - data[index - 1].macdHistogram;
    signal += Math.max(-15, Math.min(15, histAccel * 100));
  }
  
  // 3. Volume-Price Confirmation
  const volMA = data.slice(index - 10, index).reduce((sum, d) => sum + d.volume, 0) / 10;
  const priceChange = (current.close - data[index - 1].close) / data[index - 1].close;
  const volRatio = current.volume / volMA;
  
  if (priceChange > 0 && volRatio > 1.5) signal += 15; // Volume confirms upside
  else if (priceChange < 0 && volRatio > 1.5) signal -= 15; // Volume confirms downside
  else if (Math.abs(priceChange) > 0.02 && volRatio < 0.7) signal -= 10; // No volume support
  
  // 4. Support/Resistance Proximity
  const recent20High = Math.max(...data.slice(index - 20, index).map(d => d.high));
  const recent20Low = Math.min(...data.slice(index - 20, index).map(d => d.low));
  const range = recent20High - recent20Low;
  const positionInRange = (current.close - recent20Low) / range;
  
  if (positionInRange < 0.2) signal += 10; // Near support
  else if (positionInRange > 0.8) signal -= 10; // Near resistance
  
  return signal;
}

// 기관급 종합 매매 신호 계산
export function calculateInstitutionalTradingSignal(data, index) {
  // 최소 10일 데이터만 있으면 작동
  if (!data || index < 10 || index >= data.length) return { signal: 0, factors: [], positionSize: {}, recommendation: { action: "WAIT", description: "데이터 수집 중" } };
  
  const current = data[index];
  const factors = [];
  let totalSignal = 0;
  
  // Market Regime Context
  const marketRegime = detectMarketRegime(data, index);
  factors.push({
    name: "시장 레짐",
    value: marketRegime,
    weight: 0.0,
    description: marketRegime
  });
  
  // 1. Advanced Trend Analysis with Multiple Timeframes
  const adx = calculateADX(data, index, 14);
  const trendDirection = current.close > current.ma20 ? 1 : -1;
  let trendScore = 0;
  
  if (adx > 40) {
    trendScore = trendDirection * 30; // Strong trend
  } else if (adx > 25) {
    trendScore = trendDirection * 20; // Moderate trend
  } else if (adx < 20) {
    trendScore = 0; // No trend
  }
  
  // Multi-timeframe confirmation
  if (current.ma5 > current.ma20 && current.ma20 > current.ma60) {
    trendScore = Math.max(trendScore, 25); // Perfect alignment
  } else if (current.ma5 < current.ma20 && current.ma20 < current.ma60) {
    trendScore = Math.min(trendScore, -25); // Perfect downtrend
  }
  
  factors.push({
    name: "멀티타임프레임 추세",
    value: trendScore,
    weight: 0.20
  });
  totalSignal += trendScore * 0.20;
  
  // 2. Enhanced Technical Composite
  const technicalSignal = calculateAdvancedTechnicalSignal(data, index);
  factors.push({
    name: "고급 기술적 신호",
    value: technicalSignal,
    weight: 0.25
  });
  totalSignal += technicalSignal * 0.25;
  
  // 3. 변동성 조정 수익률 (Volatility-Adjusted Return)
  const volAdjReturn = calculateVolatilityAdjustedReturn(data, index);
  factors.push({
    name: "변동성 조정 수익률",
    value: volAdjReturn * 100,
    weight: 0.15
  });
  totalSignal += volAdjReturn * 15;
  
  // 4. 시장 미시구조 (Market Microstructure)
  const microstructure = analyzeMarketMicrostructure(data, index);
  factors.push({
    name: "시장 미시구조",
    value: microstructure * 100,
    weight: 0.20
  });
  totalSignal += microstructure * 20;
  
  // 5. Enhanced Smart Money Flow with Institutional Patterns
  const smartMoneyScore = calculateInstitutionalSmartMoneyScore(data, index);
  const instActivity = detectInstitutionalActivity(data, index);
  
  let smartMoneySignal = (smartMoneyScore.score - 50) / 50;
  
  // Boost signal based on institutional phase
  if (instActivity.phase === 'ACCUMULATION') {
    smartMoneySignal = Math.min(1, smartMoneySignal * 1.5);
  } else if (instActivity.phase === 'DISTRIBUTION') {
    smartMoneySignal = Math.max(-1, smartMoneySignal * 1.5);
  }
  
  factors.push({
    name: "기관 스마트머니",
    value: smartMoneySignal * 100,
    weight: 0.30,
    phase: instActivity.phase
  });
  totalSignal += smartMoneySignal * 30;
  
  // 6. Order Flow Analysis
  const orderFlowImbalance = analyzeOrderFlowImbalance(data, index);
  factors.push({
    name: "주문 흐름 불균형",
    value: orderFlowImbalance * 100,
    weight: 0.15
  });
  totalSignal += orderFlowImbalance * 15;
  
  // Dynamic Risk Adjustment based on Market Regime
  let riskMultiplier = 1;
  switch(marketRegime) {
    case 'HIGH_VOLATILITY':
      riskMultiplier = 0.6;
      break;
    case 'BEAR_TRENDING':
      riskMultiplier = 0.7;
      break;
    case 'BULL_TRENDING':
      riskMultiplier = 1.2;
      break;
    case 'BREAKOUT_POTENTIAL':
      riskMultiplier = 1.1;
      break;
    default:
      riskMultiplier = calculateRiskAdjustment(data, index);
  }
  
  totalSignal *= riskMultiplier;
  
  // Calculate Position Sizing
  const positionSize = calculateOptimalPositionSize(data, index);
  
  return {
    signal: Math.max(-100, Math.min(100, totalSignal)),
    factors,
    recommendation: getTradingRecommendation(totalSignal),
    confidence: calculateSignalConfidence(factors),
    positionSize,
    marketRegime,
    riskMultiplier
  };
}

// ADX (Average Directional Index) 계산
function calculateADX(data, index, period = 14) {
  if (index < period * 2) return 0;
  
  let plusDM = 0, minusDM = 0, tr = 0;
  
  for (let i = index - period + 1; i <= index; i++) {
    const curr = data[i];
    const prev = data[i - 1];
    
    const highDiff = curr.high - prev.high;
    const lowDiff = prev.low - curr.low;
    
    if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
    if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;
    
    const trueRange = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr += trueRange;
  }
  
  const plusDI = (plusDM / tr) * 100;
  const minusDI = (minusDM / tr) * 100;
  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
  
  return dx;
}

// Stochastic 오실레이터 계산
function calculateStochastic(data, index, period = 14) {
  if (index < period) return 50;
  
  const slice = data.slice(index - period + 1, index + 1);
  const highs = slice.map(d => d.high);
  const lows = slice.map(d => d.low);
  
  const highest = Math.max(...highs);
  const lowest = Math.min(...lows);
  const current = data[index].close;
  
  if (highest === lowest) return 50;
  
  return ((current - lowest) / (highest - lowest)) * 100;
}

// 복합 오실레이터 점수
function calculateOscillatorComposite(rsi, mfi, stochastic) {
  let score = 0;
  
  // RSI 신호
  if (rsi < 30) score += 30;
  else if (rsi < 40) score += 15;
  else if (rsi > 70) score -= 30;
  else if (rsi > 60) score -= 15;
  
  // MFI 신호
  if (mfi < 20) score += 25;
  else if (mfi < 35) score += 10;
  else if (mfi > 80) score -= 25;
  else if (mfi > 65) score -= 10;
  
  // Stochastic 신호
  if (stochastic < 20) score += 20;
  else if (stochastic < 35) score += 10;
  else if (stochastic > 80) score -= 20;
  else if (stochastic > 65) score -= 10;
  
  // 다이버전스 보너스
  if (rsi < 40 && mfi < 40 && stochastic < 40) score *= 1.5;
  if (rsi > 60 && mfi > 60 && stochastic > 60) score *= 1.5;
  
  return Math.max(-100, Math.min(100, score));
}

// 변동성 조정 수익률
function calculateVolatilityAdjustedReturn(data, index, lookback = 20) {
  if (index < lookback) return 0;
  
  const returns = [];
  for (let i = index - lookback + 1; i <= index; i++) {
    const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(ret);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  if (volatility === 0) return 0;
  
  // Sharpe Ratio 스타일 계산
  return avgReturn / volatility;
}

// 시장 미시구조 분석
function analyzeMarketMicrostructure(data, index) {
  if (index < 20) return 0;
  
  const current = data[index];
  const prev20 = data.slice(index - 20, index);
  
  let score = 0;
  
  // 1. 가격 효율성 (얼마나 부드럽게 움직이는가)
  const priceEfficiency = calculatePriceEfficiency(prev20);
  score += priceEfficiency * 0.3;
  
  // 2. 거래량 프로파일 (정상 분포 vs 이상 패턴)
  const volumeProfile = analyzeVolumeProfile(prev20, current);
  score += volumeProfile * 0.3;
  
  // 3. 스프레드 추정 (고저 차이 기반)
  const spreadQuality = estimateSpreadQuality(current, prev20);
  score += spreadQuality * 0.4;
  
  return score;
}

// 가격 효율성 계산
function calculatePriceEfficiency(data) {
  if (data.length < 2) return 0;
  
  let totalMove = 0;
  let netMove = Math.abs(data[data.length - 1].close - data[0].close);
  
  for (let i = 1; i < data.length; i++) {
    totalMove += Math.abs(data[i].close - data[i - 1].close);
  }
  
  if (totalMove === 0) return 0;
  
  // 효율성이 높을수록 좋음 (1에 가까울수록 직선 움직임)
  const efficiency = netMove / totalMove;
  return efficiency > 0.7 ? 1 : (efficiency > 0.3 ? 0.5 : -0.5);
}

// 거래량 프로파일 분석
function analyzeVolumeProfile(historical, current) {
  const avgVolume = historical.reduce((sum, d) => sum + d.volume, 0) / historical.length;
  const volumeRatio = current.volume / avgVolume;
  
  // 적정 거래량 (평균의 0.8 ~ 2배)
  if (volumeRatio >= 0.8 && volumeRatio <= 2) {
    return 0.5;
  } else if (volumeRatio > 3) {
    // 이상 거래량
    return current.close > historical[historical.length - 1].close ? 1 : -1;
  } else if (volumeRatio < 0.5) {
    // 거래량 부족
    return -0.5;
  }
  
  return 0;
}

// 스프레드 품질 추정
function estimateSpreadQuality(current, historical) {
  const avgRange = historical.reduce((sum, d) => sum + (d.high - d.low), 0) / historical.length;
  const currentRange = current.high - current.low;
  
  // 스프레드가 평균보다 좁으면 유동성 좋음
  if (currentRange < avgRange * 0.7) return 1;
  if (currentRange < avgRange) return 0.5;
  if (currentRange > avgRange * 1.5) return -1;
  
  return 0;
}

// 위험 조정 계수
function calculateRiskAdjustment(data, index) {
  if (index < 60) return 1;
  
  const recent20 = data.slice(index - 20, index);
  const volatility = calculateVolatility(recent20);
  
  // 변동성에 따른 조정 (높은 변동성 = 낮은 신뢰도)
  if (volatility > 0.03) return 0.7;  // 일 3% 이상 변동성
  if (volatility > 0.02) return 0.85;
  if (volatility < 0.01) return 1.1;  // 낮은 변동성 = 높은 신뢰도
  
  return 1;
}

// 변동성 계산
function calculateVolatility(data) {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
  }
  
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avg, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

// 신호 신뢰도 계산
function calculateSignalConfidence(factors) {
  // 모든 팩터가 같은 방향을 가리키면 높은 신뢰도
  const positiveFactors = factors.filter(f => f.value > 0).length;
  const negativeFactors = factors.filter(f => f.value < 0).length;
  
  const unanimity = Math.max(positiveFactors, negativeFactors) / factors.length;
  const avgStrength = factors.reduce((sum, f) => sum + Math.abs(f.value), 0) / factors.length;
  
  return Math.round((unanimity * 0.6 + avgStrength / 100 * 0.4) * 100);
}

// 스마트머니 해석 (투자자 친화적)
function getSmartMoneyInterpretation(score) {
  if (score >= 80) return "💰 기관/외인 대량 매집 중 → 강력 매수 시그널";
  if (score >= 65) return "📈 스마트머니 순매수 → 매수 고려";
  if (score >= 50) return "⚖️ 수급 균형 → 관망 추천";
  if (score >= 35) return "📉 스마트머니 이탈 시작 → 주의 필요";
  return "🚨 기관/외인 대량 매도 → 매도 고려";
}

// Enhanced Trading Recommendation with Risk Management
function getTradingRecommendation(signal) {
  const urgency = Math.abs(signal) > 70 ? "즉시" : "단계적";
  const confidence = Math.min(100, Math.abs(signal) * 1.2);
  
  if (signal >= 70) {
    return {
      action: "STRONG BUY",
      description: `${urgency} 매수 포지션 구축`,
      targetAllocation: "15-20%",
      stopLoss: "진입가 -3%",
      confidence: `${confidence}%`
    };
  } else if (signal >= 40) {
    return {
      action: "BUY",
      description: "분할 매수 진행",
      targetAllocation: "10-15%",
      stopLoss: "진입가 -5%",
      confidence: `${confidence}%`
    };
  } else if (signal >= 15) {
    return {
      action: "ACCUMULATE",
      description: "저가 분할매수 검토",
      targetAllocation: "5-10%",
      stopLoss: "진입가 -7%",
      confidence: `${confidence}%`
    };
  } else if (signal >= -15) {
    return {
      action: "HOLD",
      description: "현 포지션 유지",
      targetAllocation: "현재 유지",
      stopLoss: "동적 조정",
      confidence: `${confidence}%`
    };
  } else if (signal >= -40) {
    return {
      action: "REDUCE",
      description: "단계적 비중 축소",
      targetAllocation: "50% 감소",
      stopLoss: "즉시 실행",
      confidence: `${confidence}%`
    };
  } else if (signal >= -70) {
    return {
      action: "SELL",
      description: "포지션 청산 진행",
      targetAllocation: "20% 이하",
      stopLoss: "N/A",
      confidence: `${confidence}%`
    };
  }
  return {
    action: "EXIT",
    description: `${urgency} 전량 청산`,
    targetAllocation: "0%",
    stopLoss: "N/A",
    confidence: `${confidence}%`
  };
}

// Enhanced VWAP 계산 (다중 앵커 지원)
export function calculateEnhancedVWAP(data, anchorIndices = []) {
  if (!data || data.length === 0) return data;
  
  // 기본 앵커: 시작점, 최근 고점, 최근 저점
  if (anchorIndices.length === 0) {
    anchorIndices = [0]; // 기본값
    
    // 최근 60일 고점/저점 찾기
    if (data.length > 60) {
      const recent60 = data.slice(-60);
      let highIndex = 0, lowIndex = 0;
      let highPrice = 0, lowPrice = Infinity;
      
      recent60.forEach((d, i) => {
        const globalIndex = data.length - 60 + i;
        if (d.high > highPrice) {
          highPrice = d.high;
          highIndex = globalIndex;
        }
        if (d.low < lowPrice) {
          lowPrice = d.low;
          lowIndex = globalIndex;
        }
      });
      
      anchorIndices.push(highIndex, lowIndex);
    }
  }
  
  // 각 앵커별 VWAP 계산
  const result = data.map(d => ({ ...d }));
  
  anchorIndices.forEach((anchorIndex, anchorNum) => {
    let cumPV = 0;
    let cumV = 0;
    
    for (let i = 0; i < result.length; i++) {
      if (i < anchorIndex) {
        result[i][`vwap${anchorNum}`] = null;
        continue;
      }
      
      const typicalPrice = (result[i].high + result[i].low + result[i].close) / 3;
      const volume = result[i].volume || 0;
      
      cumPV += typicalPrice * volume;
      cumV += volume;
      
      result[i][`vwap${anchorNum}`] = cumV > 0 ? cumPV / cumV : typicalPrice;
    }
  });
  
  // 기본 VWAP (첫 번째 앵커)
  result.forEach(d => {
    d.avwap = d.vwap0;
  });
  
  return result;
}

// ============================
// PATTERN RECOGNITION ENGINE
// ============================

// 1. 세력 매집 패턴 감지
export function detectAccumulationPattern(data, index) {
  if (!data || index < 10) return { detected: false, confidence: 0 };
  
  const lookback = Math.min(20, index + 1);
  const recent20 = data.slice(Math.max(0, index - lookback + 1), index + 1);
  let signals = 0;
  
  // Signal 1: 가격 횡보 + 기관 지속 매수
  const priceRange = Math.max(...recent20.map(d => d.high)) - Math.min(...recent20.map(d => d.low));
  const avgPrice = recent20.reduce((sum, d) => sum + d.close, 0) / recent20.length;
  const priceStable = (priceRange / avgPrice) < 0.1; // 10% 이내 변동
  
  const instBuying = recent20.filter(d => (d._flows?.기관합계 || 0) > 0).length;
  if (priceStable && instBuying > 12) signals += 30;
  
  // Signal 2: 거래량 감소 + 기관 매수
  const volTrend = recent20.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 
                   recent20.slice(0, 5).reduce((sum, d) => sum + d.volume, 0);
  if (volTrend < 0.7 && instBuying > 10) signals += 25;
  
  // Signal 3: 개인 매도 + 기관/외인 매수 (스마트머니 교체)
  const smartMoneyBuy = recent20.filter(d => 
    (d._flows?.기관합계 || 0) + (d._flows?.외국인합계 || 0) > 0 &&
    (d._flows?.개인 || 0) < 0
  ).length;
  if (smartMoneyBuy > 12) signals += 25;
  
  // Signal 4: 하단 지지선 반복 테스트
  const lows = recent20.map(d => d.low);
  const minLow = Math.min(...lows);
  const supportTests = lows.filter(low => Math.abs(low - minLow) / minLow < 0.01).length;
  if (supportTests > 3) signals += 20;
  
  return {
    detected: signals >= 60,
    confidence: Math.min(100, signals),
    type: '매집',
    description: signals >= 60 ? '세력 매집 진행 중' : null
  };
}

// 2. 상승 돌파 패턴
export function detectBreakoutPattern(data, index) {
  if (!data || index < 10) return { detected: false, confidence: 0 };
  
  const current = data[index];
  const lookback = Math.min(20, index + 1);
  const recent20 = data.slice(Math.max(0, index - lookback + 1), index + 1);
  // 60일 데이터가 없으면 있는 만큼만 사용
  const lookback = Math.min(60, index + 1);
  const recent60 = data.slice(Math.max(0, index - lookback + 1), index + 1);
  
  let signals = 0;
  
  // 60일 최고가 돌파
  const high60 = Math.max(...recent60.slice(0, -1).map(d => d.high));
  if (current.close > high60) signals += 40;
  
  // 거래량 폭발 (평균 대비 200% 이상)
  const avgVol = recent20.slice(0, -1).reduce((sum, d) => sum + d.volume, 0) / 19;
  if (current.volume > avgVol * 2) signals += 30;
  
  // 스마트머니 대량 매수
  const smartMoney = (current._flows?.기관합계 || 0) + (current._flows?.외국인합계 || 0);
  const avgSmartMoney = recent20.slice(0, -1).reduce((sum, d) => 
    sum + (d._flows?.기관합계 || 0) + (d._flows?.외국인합계 || 0), 0) / 19;
  if (smartMoney > avgSmartMoney * 3) signals += 30;
  
  return {
    detected: signals >= 70,
    confidence: Math.min(100, signals),
    type: '돌파',
    description: signals >= 70 ? '상승 돌파 신호' : null
  };
}

// 3. 급락 후 반등 패턴 (Dead Cat Bounce vs Real Reversal)
export function detectReversalPattern(data, index) {
  if (!data || index < 10) return { detected: false, confidence: 0 };
  
  const recent10 = data.slice(index - 9, index + 1);
  const current = data[index];
  
  // 최근 급락 확인 (-10% 이상)
  const highPoint = Math.max(...recent10.slice(0, 5).map(d => d.high));
  const lowPoint = Math.min(...recent10.slice(5).map(d => d.low));
  const dropRate = (lowPoint - highPoint) / highPoint;
  
  if (dropRate < -0.1) {
    let signals = 0;
    
    // 오늘 반등
    if (current.close > data[index-1].close * 1.03) signals += 30;
    
    // 기관 매수 전환
    if ((current._flows?.기관합계 || 0) > 0 && 
        (data[index-1]._flows?.기관합계 || 0) <= 0) signals += 40;
    
    // 거래량 증가
    if (current.volume > data[index-1].volume * 1.5) signals += 30;
    
    return {
      detected: signals >= 60,
      confidence: Math.min(100, signals),
      type: '반등',
      description: signals >= 60 ? '급락 후 반등 시작' : null,
      warning: signals < 80 ? '데드캣 바운스 주의' : null
    };
  }
  
  return { detected: false, confidence: 0 };
}

// 4. 매도 타이밍 패턴
export function detectDistributionPattern(data, index) {
  if (!data || index < 10) return { detected: false, confidence: 0 };
  
  const lookback = Math.min(20, index + 1);
  const recent20 = data.slice(Math.max(0, index - lookback + 1), index + 1);
  const current = data[index];
  let signals = 0;
  
  // 고점 부근에서 기관 매도
  const high20 = Math.max(...recent20.map(d => d.high));
  const nearHigh = current.close > high20 * 0.95;
  const instSelling = (current._flows?.기관합계 || 0) < 0;
  
  if (nearHigh && instSelling) signals += 40;
  
  // 거래량 증가 + 가격 정체
  const priceChange = (current.close - recent20[0].close) / recent20[0].close;
  const volIncrease = current.volume > recent20[0].volume * 1.5;
  
  if (Math.abs(priceChange) < 0.02 && volIncrease && instSelling) signals += 30;
  
  // 개인 매수 폭증 (물량 떠넘기기)
  const retailBuying = (current._flows?.개인 || 0) > 0;
  const retailAmount = Math.abs(current._flows?.개인 || 0);
  const avgRetail = recent20.slice(0, -1).reduce((sum, d) => 
    sum + Math.abs(d._flows?.개인 || 0), 0) / 19;
  
  if (retailBuying && retailAmount > avgRetail * 2 && instSelling) signals += 30;
  
  return {
    detected: signals >= 60,
    confidence: Math.min(100, signals),
    type: '분산',
    description: signals >= 60 ? '고점 분산 매도 진행' : null
  };
}

// ============================
// ENTRY/EXIT SIGNAL SYSTEM
// ============================

export function generateTradingSignals(data, index) {
  if (!data || index < 10) return null;
  
  const current = data[index];
  const signals = [];
  
  // 패턴 체크
  const accumulation = detectAccumulationPattern(data, index);
  const breakout = detectBreakoutPattern(data, index);
  const reversal = detectReversalPattern(data, index);
  const distribution = detectDistributionPattern(data, index);
  
  // 기술적 지표
  const tradingSignal = calculateInstitutionalTradingSignal(data, index);
  const smartMoney = calculateInstitutionalSmartMoneyScore(data, index);
  
  // BUY SIGNALS
  if (accumulation.detected && smartMoney.score > 55) {
    signals.push({
      type: 'BUY',
      strength: 'STRONG',
      entry: current.close,
      stopLoss: current.close * 0.95,
      target1: current.close * 1.05,
      target2: current.close * 1.10,
      target3: current.close * 1.20,
      reason: '세력 매집 완료 + 스마트머니 유입',
      confidence: (accumulation.confidence + smartMoney.score) / 2,
      riskReward: 2.0
    });
  }
  
  if (breakout.detected && tradingSignal.signal > 50) {
    signals.push({
      type: 'BUY',
      strength: 'STRONG',
      entry: current.close,
      stopLoss: current.close * 0.97,
      target1: current.close * 1.08,
      target2: current.close * 1.15,
      target3: current.close * 1.30,
      reason: '돌파 매수 신호',
      confidence: breakout.confidence,
      riskReward: 3.5
    });
  }
  
  if (reversal.detected && !reversal.warning) {
    signals.push({
      type: 'BUY',
      strength: 'MODERATE',
      entry: current.close,
      stopLoss: current.close * 0.93,
      target1: current.close * 1.07,
      target2: current.close * 1.12,
      reason: '급락 후 반등',
      confidence: reversal.confidence,
      riskReward: 1.7,
      warning: '분할 매수 권장'
    });
  }
  
  // SELL SIGNALS
  if (distribution.detected) {
    signals.push({
      type: 'SELL',
      strength: 'STRONG',
      exit: current.close,
      reason: '기관 분산 매도',
      confidence: distribution.confidence,
      action: '전량 매도 또는 50% 이상 비중 축소'
    });
  }
  
  if (tradingSignal.signal < -50 && smartMoney.score < 40) {
    signals.push({
      type: 'SELL',
      strength: 'STRONG',
      exit: current.close,
      reason: '종합 매도 신호 + 스마트머니 이탈',
      confidence: 85,
      action: '즉시 청산'
    });
  }
  
  // Default weak signals based on trend
  if (signals.length === 0) {
    // 기본 트렌드 신호 추가
    if (smartMoney.score > 50) {
      signals.push({
        type: 'BUY',
        strength: 'WEAK',
        entry: current.close,
        stopLoss: current.close * 0.97,
        target1: current.close * 1.03,
        target2: current.close * 1.05,
        reason: '스마트머니 점수 양호',
        confidence: smartMoney.score,
        riskReward: 1.0
      });
    } else if (smartMoney.score < 50) {
      signals.push({
        type: 'SELL',
        strength: 'WEAK',
        exit: current.close,
        reason: '스마트머니 점수 부진',
        confidence: 100 - smartMoney.score,
        action: '부분 익절 고려'
      });
    }
  }
  
  // Risk Management
  const volatility = calculateVolatility(data.slice(index - 19, index + 1));
  const positionSize = calculateOptimalPositionSize(data, index);
  
  return {
    signals,
    bestSignal: signals.sort((a, b) => b.confidence - a.confidence)[0],
    riskLevel: volatility > 0.03 ? 'HIGH' : volatility > 0.02 ? 'MEDIUM' : 'LOW',
    suggestedPosition: positionSize,
    summary: signals.length > 0 ? 
      `${signals.filter(s => s.type === 'BUY').length}개 매수, ${signals.filter(s => s.type === 'SELL').length}개 매도 신호` :
      '관망'
  };
}

// Advanced Backtesting with Realistic Execution
export function backtestSignalPerformance(data, lookback = 60) {
  if (!data || data.length < Math.max(20, lookback)) return null;
  
  // 데이터가 적으면 lookback 조정
  const adjustedLookback = Math.min(lookback, Math.max(20, data.length - 20));
  
  const trades = [];
  let capital = 100000000; // 1억원 시작
  let position = 0;
  let entryPrice = 0;
  
  for (let i = adjustedLookback; i < data.length - 1; i++) {
    const signals = generateTradingSignals(data, i);
    
    if (!signals || !signals.bestSignal) continue;
    
    const signal = signals.bestSignal;
    const current = data[i];
    const next = data[i + 1];
    
    // BUY 실행
    if (signal.type === 'BUY' && position === 0) {
      const shares = Math.floor((capital * 0.3) / next.open); // 30% 포지션
      position = shares;
      entryPrice = next.open;
      capital -= shares * next.open * 1.003; // 수수료 0.3%
      
      trades.push({
        date: next.date,
        type: 'BUY',
        price: next.open,
        shares,
        reason: signal.reason
      });
    }
    
    // SELL 실행 또는 손절/익절
    if (position > 0) {
      const currentPrice = next.close;
      const profitRate = (currentPrice - entryPrice) / entryPrice;
      
      // 익절 체크 (10% 수익)
      if (profitRate > 0.10) {
        capital += position * currentPrice * 0.997; // 수수료 차감
        trades.push({
          date: next.date,
          type: 'SELL',
          price: currentPrice,
          shares: position,
          profit: profitRate * 100,
          reason: '목표가 도달 (익절)'
        });
        position = 0;
      }
      // 손절 체크 (-5% 손실)
      else if (profitRate < -0.05) {
        capital += position * currentPrice * 0.997;
        trades.push({
          date: next.date,
          type: 'SELL',
          price: currentPrice,
          shares: position,
          profit: profitRate * 100,
          reason: '손절'
        });
        position = 0;
      }
      // 매도 신호
      else if (signal.type === 'SELL' && signal.strength === 'STRONG') {
        capital += position * currentPrice * 0.997;
        trades.push({
          date: next.date,
          type: 'SELL',
          price: currentPrice,
          shares: position,
          profit: profitRate * 100,
          reason: signal.reason
        });
        position = 0;
      }
    }
  }
  
  // 최종 정산
  if (position > 0) {
    const lastPrice = data[data.length - 1].close;
    capital += position * lastPrice * 0.997;
  }
  
  // 성과 계산
  const totalReturn = ((capital - 100000000) / 100000000) * 100;
  const winTrades = trades.filter(t => t.type === 'SELL' && t.profit > 0);
  const loseTrades = trades.filter(t => t.type === 'SELL' && t.profit <= 0);
  const winRate = winTrades.length / (winTrades.length + loseTrades.length) * 100;
  
  const avgWin = winTrades.length > 0 ? 
    winTrades.reduce((sum, t) => sum + t.profit, 0) / winTrades.length : 0;
  const avgLoss = loseTrades.length > 0 ?
    Math.abs(loseTrades.reduce((sum, t) => sum + t.profit, 0) / loseTrades.length) : 0;
  
  // 최대 낙폭 계산
  let maxCapital = 100000000;
  let maxDrawdown = 0;
  let runningCapital = 100000000;
  
  trades.forEach(trade => {
    if (trade.type === 'SELL') {
      runningCapital *= (1 + trade.profit / 100);
      maxCapital = Math.max(maxCapital, runningCapital);
      const drawdown = (maxCapital - runningCapital) / maxCapital;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  });
  
  return {
    totalReturn: totalReturn.toFixed(2),
    totalTrades: trades.length,
    winRate: winRate.toFixed(1),
    avgWin: avgWin.toFixed(2),
    avgLoss: avgLoss.toFixed(2),
    profitFactor: avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A',
    maxDrawdown: (maxDrawdown * 100).toFixed(2),
    sharpeRatio: calculateSharpeRatio(trades),
    trades: trades.slice(-10), // 최근 10개 거래
    finalCapital: capital
  };
}

// Sharpe Ratio 계산
function calculateSharpeRatio(trades) {
  if (trades.length < 2) return 0;
  
  const returns = trades
    .filter(t => t.type === 'SELL')
    .map(t => t.profit / 100);
  
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? (avgReturn / stdDev * Math.sqrt(252)).toFixed(2) : 0;
}

const institutionalAnalytics = {
  calculateInstitutionalSmartMoneyScore,
  calculateInstitutionalTradingSignal,
  calculateEnhancedVWAP,
  detectMarketRegime,
  calculateOptimalPositionSize,
  backtestSignalPerformance,
  generateTradingSignals,
  detectAccumulationPattern,
  detectBreakoutPattern,
  detectReversalPattern,
  detectDistributionPattern
};

export default institutionalAnalytics;