import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "../ui/button";

export default function CSVInputs({ priceCSV, flowCSV, dispatch }) {
  const [priceFileName, setPriceFileName] = useState("");
  const [flowFileName, setFlowFileName] = useState("");

  const handleFileUpload = (file, actionType, fileNameSetter) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      dispatch({ type: actionType, payload: e.target.result });
      fileNameSetter(file.name);
    };
    reader.readAsText(file);
  };

  const clearPriceData = () => {
    dispatch({ type: "SET_PRICE_CSV", payload: "" });
    setPriceFileName("");
  };

  const clearFlowData = () => {
    dispatch({ type: "SET_FLOW_CSV", payload: "" });
    setFlowFileName("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">가격/거래량 CSV 파일</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priceFileName ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">{priceFileName}</span>
                </div>
                <Button
                  onClick={clearPriceData}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">CSV 파일 업로드</span>
                <span className="text-xs text-slate-400 mt-1">
                  date, close, open, high, low, volume
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e.target.files[0], "SET_PRICE_CSV", setPriceFileName)}
                />
              </label>
            )}
            
            {/* 텍스트 직접 입력 옵션 (토글 가능) */}
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-800">
                또는 CSV 텍스트 직접 입력
              </summary>
              <textarea
                className="w-full h-32 mt-2 p-3 border rounded-lg focus:outline-none focus:ring focus:ring-slate-200 text-xs font-mono"
                placeholder="date,close,open,high,low,volume
2025-08-01,19500,19820,19400,19710,2210000
..."
                value={priceCSV}
                onChange={(e) => {
                  dispatch({ type: "SET_PRICE_CSV", payload: e.target.value });
                  setPriceFileName("");
                }}
              />
            </details>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">수급 CSV 파일 (KRX 세부)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flowFileName ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">{flowFileName}</span>
                </div>
                <Button
                  onClick={clearFlowData}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">CSV 파일 업로드</span>
                <span className="text-xs text-slate-400 mt-1">
                  날짜, 금융투자, 보험, 투신, 사모...
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e.target.files[0], "SET_FLOW_CSV", setFlowFileName)}
                />
              </label>
            )}
            
            {/* 텍스트 직접 입력 옵션 (토글 가능) */}
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 hover:text-slate-800">
                또는 CSV 텍스트 직접 입력
              </summary>
              <textarea
                className="w-full h-32 mt-2 p-3 border rounded-lg focus:outline-none focus:ring focus:ring-slate-200 text-xs font-mono"
                placeholder="날짜,금융투자,보험,투신,사모...
2025-08-01,1200000000,-300000000..."
                value={flowCSV}
                onChange={(e) => {
                  dispatch({ type: "SET_FLOW_CSV", payload: e.target.value });
                  setFlowFileName("");
                }}
              />
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}