import React, { useMemo, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { LineChart as LineChartIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";

// Utilities
import { DEFAULT_SELECTED_CATEGORIES, DEFAULT_UNIT_SCALE } from "./constants/sampleData";
import { useDataProcessing } from "./hooks/useDataProcessing";
import { useSelfTest } from "./hooks/useSelfTest";

// Components
import PeriodSelector from "./components/controls/PeriodSelector";
import DataLoader from "./components/controls/DataLoader";
import FlowDisplayOptions from "./components/controls/FlowDisplayOptions";
import CSVInputs from "./components/controls/CSVInputs";
// Charts
const AdvancedPriceChart = React.lazy(() => import(/* webpackChunkName: "AdvancedPriceChart" */ "./components/charts/AdvancedPriceChart"));
const EnhancedInvestorFlowChart = React.lazy(() => import(/* webpackChunkName: "EnhancedInvestorFlowChart" */ "./components/charts/EnhancedInvestorFlowChart"));
const EnhancedIndicatorsChart = React.lazy(() => import(/* webpackChunkName: "EnhancedIndicatorsChart" */ "./components/charts/EnhancedIndicatorsChart"));
const EnhancedOBVFlowChart = React.lazy(() => import(/* webpackChunkName: "EnhancedOBVFlowChart" */ "./components/charts/EnhancedOBVFlowChart"));
const VolumeProfileChart = React.lazy(() => import(/* webpackChunkName: "VolumeProfileChart" */ "./components/charts/VolumeProfileChart"));

const ChartFallback = <div className="p-4 text-center text-slate-500">Loading chart...</div>;
import SelfTest from "./components/SelfTest";
import InstitutionalDashboard from "./components/InstitutionalDashboard";
import TradingSignalPanel from "./components/TradingSignalPanel";

export default function ParadiseFlowDashboard() {
  // State management
  const [priceCSV, setPriceCSV] = useState("");
  const [flowCSV, setFlowCSV] = useState("");
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [days, setDays] = useState(60);
  const [useSample, setUseSample] = useState(false);
  const [unitScale, setUnitScale] = useState(DEFAULT_UNIT_SCALE);
  const [selectedCats, setSelectedCats] = useState(DEFAULT_SELECTED_CATEGORIES);

  // Custom hooks
  const { enriched } = useDataProcessing(priceCSV, flowCSV, useSample, anchorIndex);
  const { testLog, runSelfTests } = useSelfTest();
  
  // 디버깅: 데이터 확인
  React.useEffect(() => {
    if (enriched && enriched.length > 0) {
      const lastData = enriched[enriched.length - 1];
      console.log('Last enriched data:', {
        date: lastData.date,
        close: lastData.close,
        _flows: lastData._flows,
        _cum: lastData._cum
      });
    }
  }, [enriched]);

  // Time range slice
  const viewData = useMemo(() => {
    if (!enriched || enriched.length === 0) return [];
    const start = Math.max(0, enriched.length - days);
    return enriched.slice(start);
  }, [enriched, days]);

  // Computed values
  const unitName = useMemo(() => (
    unitScale === 1 ? "원" : 
    unitScale === 1000000 ? "백만원" : 
    unitScale === 100000000 ? "억원" : 
    `x${unitScale}`
  ), [unitScale]);

  // Event handlers
  const toggleCat = useCallback((k) => {
    setSelectedCats((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }, []);

  const handleChartClick = useCallback((e) => {
    if (e && e.activeTooltipIndex != null) {
      setAnchorIndex(enriched.indexOf(viewData[e.activeTooltipIndex]));
    }
  }, [enriched, viewData]);

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen p-4 md:p-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <LineChartIcon className="w-7 h-7" /> PARADISE (034230) — Flow & Price Dashboard
                </h1>
                <p className="text-slate-600 mt-1">
                  전문 투자자를 위한 고급 분석 대시보드 • 데이터 기반 투자 의사결정 지원
                </p>
              </div>
            </div>
          </motion.div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PeriodSelector days={days} setDays={setDays} />
          <DataLoader 
            setUseSample={setUseSample} 
            setPriceCSV={setPriceCSV} 
            setFlowCSV={setFlowCSV} 
            setAnchorIndex={setAnchorIndex} 
          />
          <FlowDisplayOptions 
            unitScale={unitScale} 
            setUnitScale={setUnitScale} 
            selectedCats={selectedCats} 
            toggleCat={toggleCat} 
          />
        </div>

          {/* CSV inputs */}
          <CSVInputs 
            priceCSV={priceCSV} 
            setPriceCSV={setPriceCSV} 
            flowCSV={flowCSV} 
            setFlowCSV={setFlowCSV} 
          />

          {/* Trading Signal Panel - 최우선 표시 */}
          <TradingSignalPanel data={viewData} />
          
          {/* Institutional Dashboard */}
          <InstitutionalDashboard data={viewData} unitScale={unitScale} />

          {/* Main Charts */}
          <Suspense fallback={ChartFallback}>
            <AdvancedPriceChart data={viewData} onChartClick={handleChartClick} />
          </Suspense>

          {/* Volume Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Suspense fallback={ChartFallback}>
              <VolumeProfileChart data={viewData} />
            </Suspense>
            <Suspense fallback={ChartFallback}>
              <EnhancedOBVFlowChart data={viewData} unitScale={unitScale} />
            </Suspense>
          </div>

          {/* Investor Flow */}
          <Suspense fallback={ChartFallback}>
            <EnhancedInvestorFlowChart data={viewData} selectedCats={selectedCats} unitScale={unitScale} unitName={unitName} />
          </Suspense>

          {/* Technical Indicators */}
          <Suspense fallback={ChartFallback}>
            <EnhancedIndicatorsChart data={viewData} />
          </Suspense>

        {/* Self Test */}
        <SelfTest testLog={testLog} runSelfTests={runSelfTests} />

        {/* Footer Note */}
        <div className="text-xs text-slate-500 leading-relaxed">
          ⚠️ 면책: 실제 매매 판단 시에는 반드시 최신 공식 데이터(CSV)를 로드하여 확인하세요. 
          CSV 업로드가 어려우면 채팅창에 "데이터 가져와줘"라고 입력해 주세요. 제가 최신 데이터를 검색·정리해 여기에 즉시 반영해 드립니다.
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
}