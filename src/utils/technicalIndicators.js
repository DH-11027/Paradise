// 기술적 지표 계산 함수들

// 단순 이동평균 계산
export function calculateSMA(data, period, key = 'close') {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + (d[key] || 0), 0);
      result.push(sum / period);
    }
  }
  return result;
}

// 볼린저 밴드 계산
export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const sma = calculateSMA(data, period);
  const bands = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      bands.push({ upper: null, middle: null, lower: null });
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (stdDev * std),
        middle: mean,
        lower: mean - (stdDev * std)
      });
    }
  }
  return bands;
}

// RSI 계산
export function calculateRSI(data, period = 14) {
  const changes = [];
  const gains = [];
  const losses = [];
  
  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    changes.push(change);
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const rsi = [null]; // 첫 번째 값은 null
  
  // 첫 번째 평균 계산
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    } else {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  // 처음 period 개의 null 값 추가
  while (rsi.length < data.length) {
    rsi.unshift(null);
  }
  
  return rsi;
}

// MACD 계산
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  const macd = [];
  const signal = [];
  const histogram = [];
  
  // MACD 라인 계산
  for (let i = 0; i < data.length; i++) {
    if (i < slowPeriod - 1) {
      macd.push(null);
    } else {
      macd.push(emaFast[i] - emaSlow[i]);
    }
  }
  
  // Signal 라인 계산 (MACD의 EMA)
  const macdData = macd.filter(v => v !== null).map(v => ({ close: v }));
  const signalEMA = calculateEMA(macdData, signalPeriod);
  
  let signalIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (macd[i] === null) {
      signal.push(null);
      histogram.push(null);
    } else if (signalIndex < signalPeriod - 1) {
      signal.push(null);
      histogram.push(null);
      signalIndex++;
    } else {
      signal.push(signalEMA[signalIndex - signalPeriod + 1]);
      histogram.push(macd[i] - signal[i]);
      signalIndex++;
    }
  }
  
  return { macd, signal, histogram };
}

// 지수 이동평균 계산
export function calculateEMA(data, period) {
  const multiplier = 2 / (period + 1);
  const ema = [];
  
  // 첫 번째 EMA는 SMA로 시작
  const firstSMA = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      ema.push(firstSMA);
    } else {
      ema.push((data[i].close - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  
  return ema;
}

// 매수/매도 신호 점수 계산
export function calculateSignalScore(data, index) {
  if (!data || index < 60 || index >= data.length) return { score: 0, signals: [] };
  
  const current = data[index];
  const signals = [];
  let score = 0;
  
  // 1. 이동평균선 배열 (20 < 60 < 120)
  if (current.ma20 && current.ma60 && current.ma120) {
    if (current.ma20 > current.ma60 && current.ma60 > current.ma120) {
      score += 20;
      signals.push({ name: "정배열", type: "bullish", weight: 20 });
    } else if (current.ma20 < current.ma60 && current.ma60 < current.ma120) {
      score -= 20;
      signals.push({ name: "역배열", type: "bearish", weight: -20 });
    }
  }
  
  // 2. 가격 vs 이동평균선
  if (current.ma20) {
    if (current.close > current.ma20) {
      score += 10;
      signals.push({ name: "20일선 위", type: "bullish", weight: 10 });
    } else {
      score -= 10;
      signals.push({ name: "20일선 아래", type: "bearish", weight: -10 });
    }
  }
  
  // 3. 볼린저 밴드 위치
  if (current.bbUpper && current.bbLower) {
    if (current.close > current.bbUpper) {
      score -= 15; // 과매수
      signals.push({ name: "BB 상단 돌파", type: "bearish", weight: -15 });
    } else if (current.close < current.bbLower) {
      score += 15; // 과매도
      signals.push({ name: "BB 하단 돌파", type: "bullish", weight: 15 });
    }
  }
  
  // 4. RSI
  if (current.rsi14 != null) {
    if (current.rsi14 > 70) {
      score -= 15;
      signals.push({ name: "RSI 과매수", type: "bearish", weight: -15 });
    } else if (current.rsi14 < 30) {
      score += 15;
      signals.push({ name: "RSI 과매도", type: "bullish", weight: 15 });
    }
  }
  
  // 5. MFI
  if (current.mfi14 != null) {
    if (current.mfi14 > 80) {
      score -= 10;
      signals.push({ name: "MFI 과매수", type: "bearish", weight: -10 });
    } else if (current.mfi14 < 20) {
      score += 10;
      signals.push({ name: "MFI 과매도", type: "bullish", weight: 10 });
    }
  }
  
  // 6. 거래량
  const avgVolume = data.slice(index - 20, index).reduce((acc, d) => acc + d.volume, 0) / 20;
  if (current.volume > avgVolume * 1.5 && current.close > data[index - 1].close) {
    score += 10;
    signals.push({ name: "거래량 급증(상승)", type: "bullish", weight: 10 });
  } else if (current.volume > avgVolume * 1.5 && current.close < data[index - 1].close) {
    score -= 10;
    signals.push({ name: "거래량 급증(하락)", type: "bearish", weight: -10 });
  }
  
  // 7. 수급 (외국인 + 기관)
  const smartMoney = (current._flows?.외국인 || 0) + (current._flows?.기관합계 || 0);
  if (smartMoney > 0) {
    score += 20;
    signals.push({ name: "스마트머니 매수", type: "bullish", weight: 20 });
  } else if (smartMoney < 0) {
    score -= 20;
    signals.push({ name: "스마트머니 매도", type: "bearish", weight: -20 });
  }
  
  return { score, signals };
}