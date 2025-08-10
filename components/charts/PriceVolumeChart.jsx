import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Activity } from "lucide-react";
import { fmtDate } from "../../utils/dataUtils";

export default function PriceVolumeChart({ data, onChartClick }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4"/>가격/거래량 + Anchored VWAP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={data} onClick={onChartClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, "auto"]} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Legend />
              {/* Close price */}
              <Line type="monotone" dataKey="close" name="종가" yAxisId="left" dot={false} strokeWidth={2} />
              {/* Anchored VWAP */}
              <Line type="monotone" dataKey="avwap" name="Anchored VWAP" yAxisId="left" dot={false} strokeDasharray="5 5" />
              {/* Volume */}
              <Bar dataKey="volume" name="거래량" yAxisId="right" opacity={0.4} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          차트를 클릭하면 해당 지점으로 AVWAP 기준이 이동합니다. (VWAP 앵커 초기화 버튼으로 원복)
        </div>
      </CardContent>
    </Card>
  );
}