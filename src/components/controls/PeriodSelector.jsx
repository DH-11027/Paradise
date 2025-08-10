import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export default function PeriodSelector({ days, dispatch }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">기간 선택</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant={days === 30 ? "default" : "secondary"} onClick={() => dispatch({ type: "SET_DAYS", payload: 30 })}>30일</Button>
          <Button variant={days === 60 ? "default" : "secondary"} onClick={() => dispatch({ type: "SET_DAYS", payload: 60 })}>60일</Button>
          <Button variant={days === 90 ? "default" : "secondary"} onClick={() => dispatch({ type: "SET_DAYS", payload: 90 })}>90일</Button>
          <Button variant={days === 180 ? "default" : "secondary"} onClick={() => dispatch({ type: "SET_DAYS", payload: 180 })}>6개월</Button>
        </div>
        <div className="text-xs text-slate-500">
          표본 데이터는 7/10~8/8을 포함합니다. 실제 트레이딩엔 반드시 최신 CSV를 로드하세요.
        </div>
      </CardContent>
    </Card>
  );
}