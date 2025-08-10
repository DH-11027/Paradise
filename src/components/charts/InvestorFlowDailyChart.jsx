import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fmtDate, toNum } from "../../utils/dataUtils";

export default function InvestorFlowDailyChart({ data, selectedCats, unitScale, unitName }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base">투자주체별 수급 — 일별(스택) / 단위: {unitName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={data} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Legend />
              {selectedCats.map((k) => {
                console.log(`Rendering bar for ${k}`);
                return (
                  <Bar 
                    key={k} 
                    stackId="flows" 
                    name={k} 
                    dataKey={(d) => {
                      const value = d._flows && (d._flows[k] ?? 
                        (k === "외국인합계" ? (toNum(d._flows["외국인"]) + toNum(d._flows["기타외국인"])) : 0));
                      if (k === "외국인합계" && d.date && d.date.includes('2020-08-10')) {
                        console.log(`외국인합계 for ${d.date}:`, {
                          외국인: d._flows?.["외국인"],
                          기타외국인: d._flows?.["기타외국인"],
                          합계: value
                        });
                      }
                      return value / unitScale;
                    }} 
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}