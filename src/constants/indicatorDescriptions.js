export const INDICATOR_DESCRIPTIONS = {
  VWAP: {
    name: "VWAP (거래량 가중 평균가)",
    simple: "하루 동안 거래된 주식의 평균 가격입니다. 큰 손들이 매매한 평균 가격으로 이해하시면 됩니다.",
    expert: "Volume Weighted Average Price - 기관투자자의 실제 평균 매수가를 추정하는 핵심 지표. VWAP 위에서는 매도 우위, 아래에서는 매수 우위로 판단합니다.",
    signal: {
      buy: "주가가 VWAP 아래에 있고 상향 돌파 시도 시",
      sell: "주가가 VWAP 위에서 지지받지 못하고 하향 돌파 시",
      institutional: "대형 기관은 VWAP 근처에서 분할 매매하여 시장 충격을 최소화합니다."
    }
  },
  MFI: {
    name: "MFI (자금흐름지표)",
    simple: "돈이 주식으로 들어오는지 나가는지를 보여주는 지표입니다. 80 이상이면 과열, 20 이하면 침체 상태입니다.",
    expert: "Money Flow Index - RSI에 거래량을 가중한 모멘텀 지표. 기관의 자금 유입/유출을 추적하는데 유용합니다.",
    signal: {
      buy: "MFI 20 이하에서 상승 반전 시 (과매도 구간 이탈)",
      sell: "MFI 80 이상에서 하락 반전 시 (과매수 구간 이탈)",
      institutional: "MFI 다이버전스는 대형 기관의 은밀한 포지션 변화를 시사할 수 있습니다."
    }
  },
  ATR: {
    name: "ATR (평균 실제 변동폭)",
    simple: "주가가 하루에 평균적으로 얼마나 움직이는지 보여줍니다. 숫자가 클수록 변동이 심합니다.",
    expert: "Average True Range - 변동성 측정의 표준. 포지션 사이징과 손절선 설정의 기준이 됩니다.",
    signal: {
      positionSize: "계좌의 1% 리스크 / ATR = 적정 주식 수",
      stopLoss: "진입가 - (2 × ATR) = 손절가",
      institutional: "ATR이 급증하면 대형 이벤트 대비 포지션 축소를 고려해야 합니다."
    }
  },
  OBV: {
    name: "OBV (누적 거래량)",
    simple: "주가가 오를 때의 거래량은 더하고, 내릴 때는 빼서 누적한 값입니다. 큰 손들의 매집/분산을 추적합니다.",
    expert: "On Balance Volume - 스마트머니의 축적/분배를 추적. 가격과의 다이버전스가 핵심 시그널입니다.",
    signal: {
      buy: "주가는 하락하나 OBV는 상승 (숨은 매집)",
      sell: "주가는 상승하나 OBV는 하락 (숨은 분산)",
      institutional: "OBV 기울기 변화는 기관의 포지션 방향 전환을 의미합니다."
    }
  },
  FLOW: {
    name: "투자주체별 수급",
    simple: "외국인, 기관, 개인이 각각 얼마나 사고 팔았는지 보여줍니다. 똑똑한 돈을 따라가는 것이 중요합니다.",
    expert: "Investor Flow Analysis - 시장 참여자별 포지션 변화 추적. 스마트머니(외국인+기관)와 덤머니(개인)의 divergence가 핵심입니다.",
    categories: {
      외국인: "글로벌 헤지펀드, 해외 연기금 등. 가장 영향력 있는 투자 주체",
      기관: "국내 자산운용사, 보험사, 연기금. 중장기 투자 성향",
      개인: "개인투자자. 역지표로 활용 가능",
      연기금: "국민연금, 공무원연금 등. 초장기 투자, 안정성 추구"
    }
  }
};

export const RISK_INDICATORS = {
  VaR: {
    name: "VaR (Value at Risk)",
    simple: "내일 최악의 경우 얼마나 손실 볼 수 있는지 보여줍니다.",
    expert: "95% 신뢰수준에서의 일일 최대 예상 손실. 30조원 운용 시 VaR 한도 설정이 필수입니다.",
    calculation: "Portfolio Value × Volatility × 1.65"
  },
  SHARPE: {
    name: "샤프 비율",
    simple: "위험 대비 수익이 얼마나 좋은지 보여주는 점수입니다. 높을수록 좋습니다.",
    expert: "위험조정 수익률. 1.0 이상이면 양호, 2.0 이상이면 우수한 전략입니다.",
    benchmark: {
      poor: "< 0.5",
      acceptable: "0.5 - 1.0",
      good: "1.0 - 2.0",
      excellent: "> 2.0"
    }
  },
  LIQUIDITY: {
    name: "유동성 지표",
    simple: "이 주식을 큰 금액으로 사고팔 수 있는지 보여줍니다.",
    expert: "Market Impact 분석. 일평균 거래대금의 10% 이상 거래 시 가격 충격 발생 가능성 높음.",
    limits: {
      safe: "일평균 거래대금의 5% 이하",
      caution: "일평균 거래대금의 5-10%",
      danger: "일평균 거래대금의 10% 초과"
    }
  }
};