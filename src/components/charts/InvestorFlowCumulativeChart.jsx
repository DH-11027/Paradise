import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fmtDate, toNum } from "../../utils/dataUtils";

export default function InvestorFlowCumulativeChart({ data, selectedCats, unitScale, unitName }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base">투자주체별 누적 수급 — 라인 / 단위: {unitName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Legend />
              {selectedCats.map((k) => (
                <Line 
                  key={k} 
                  type="monotone" 
                  dot={false} 
                  name={k} 
                  dataKey={(d) => (d._cum && (d._cum[k] ?? 
                    (k === "외국인합계" ? (toNum(d._cum["외국인"]) + toNum(d._cum["기타외국인"])) : 0))) / unitScale} 
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}