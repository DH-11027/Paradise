import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export default function SelfTest({ testLog, runSelfTests }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Self Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Button onClick={runSelfTests}>Run Self Tests</Button>
          <div className="text-xs text-slate-500">
            (CSV parser, indicators range, cumulative totals, KRX row with E-notation)
          </div>
        </div>
        {testLog.length > 0 ? (
          <ul className="list-disc pl-6 text-sm">
            {testLog.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">아직 테스트를 실행하지 않았습니다.</div>
        )}
      </CardContent>
    </Card>
  );
}