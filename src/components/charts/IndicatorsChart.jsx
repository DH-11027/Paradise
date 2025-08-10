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
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fmtDate } from "../../utils/dataUtils";

export default function IndicatorsChart({ data }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base">MFI(14) & ATR(14)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={(d) => fmtDate(d.date)} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="mfi" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="atr" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
              <Legend />
              <Line yAxisId="mfi" type="monotone" dataKey="mfi14" name="MFI(14)" dot={false} />
              <ReferenceLine yAxisId="mfi" y={80} strokeDasharray="4 4" />
              <ReferenceLine yAxisId="mfi" y={20} strokeDasharray="4 4" />
              <Line yAxisId="atr" type="monotone" dataKey="atr14" name="ATR(14)" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}