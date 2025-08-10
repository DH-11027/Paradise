import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fmtDate } from "../../utils/dataUtils";

export default function OBVFlowChart({ data, unitScale }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base">OBV & 누적 수급(요약)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="obv" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <YAxis yAxisId="flow" orientation="right" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Legend />
              <Area yAxisId="obv" type="monotone" dataKey="obv" name="OBV" dot={false} fillOpacity={0.2} />
              <Line yAxisId="flow" type="monotone" dataKey={(d) => d.cumForeign / unitScale} name="누적 외국인(합계)" dot={false} strokeDasharray="5 2" />
              <Line yAxisId="flow" type="monotone" dataKey={(d) => d.cumInst / unitScale} name="누적 기관합계" dot={false} strokeDasharray="2 5" />
              <Line yAxisId="flow" type="monotone" dataKey={(d) => (d.cumPerson || 0) / unitScale} name="누적 개인" dot={false} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}