"use client";

import { useState } from "react";
import type { TaxiStatus } from "@/app/api/airport/taxi/route";

function parseMin(t: string): number {
  if (!t || t === "0000") return 0;
  return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10);
}

function fmtMin(t: string): string {
  const m = parseMin(t);
  if (m === 0) return "없음";
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

interface Props {
  data: TaxiStatus;
}

export function TaxiStatusCard({ data }: Props) {
  const [view, setView] = useState<"table" | "chart">("table");

  const items = [
    { label: "서울택시",   count: data.seoultaxicnt,     standtime: data.seoulstandtime },
    { label: "인천택시",   count: data.incheontaxicnt,   standtime: data.incheonstandtime },
    { label: "경기택시",   count: data.gyenggitaxicnt,   standtime: data.gyenggistandtime },
    { label: "우등택시",   count: data.besttaxicnt,      standtime: data.beststandtime },
    { label: "밴택시",     count: data.vantaxicnt,       standtime: data.vanstandtime },
    { label: "인터내셔널", count: data.intercitytaxicnt, standtime: data.intercitystandtime },
  ];

  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block bg-[#1B5E36]" />승객 대기
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block bg-gray-200" />대기 없음
          </span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-100 text-[11px] font-semibold">
          {(["table", "chart"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 transition-colors ${view === v ? "bg-gray-800 text-white" : "bg-white text-gray-400"}`}
            >
              {v === "chart" ? "그래프" : "표"}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <table className="w-full">
          <thead>
            <tr className="text-sm text-gray-500 border-b border-gray-100">
              <th className="text-left pb-2 font-semibold">종류</th>
              <th className="text-right pb-2 font-semibold">대기 대수</th>
              <th className="text-right pb-2 font-semibold">승객 대기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => {
              const hasWait = parseMin(item.standtime) > 0;
              return (
                <tr key={item.label}>
                  <td className="py-2.5 pl-1 text-sm font-semibold text-gray-600">{item.label}</td>
                  <td className="py-2.5 text-right tabular-nums text-lg font-bold" style={{ color: "#1B5E36" }}>
                    {item.count}<span className="text-xs text-gray-400 font-normal ml-0.5">대</span>
                  </td>
                  <td className="py-2.5 text-right pr-1">
                    {hasWait ? (
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-[#1B5E36] text-white">
                        {fmtMin(item.standtime)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">없음</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="space-y-3 py-1">
          {items.map((item) => {
            const hasWait = parseMin(item.standtime) > 0;
            const pct = Math.round((item.count / maxCount) * 100);
            const labelInBar = pct > 35;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0 text-right">{item.label}</span>
                <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg"
                    style={{ width: `${Math.max(pct, 4)}%`, background: hasWait ? "#1B5E36" : "#d1d5db" }}
                  />
                  <span
                    className="absolute top-0 h-full flex items-center text-xs font-bold tabular-nums"
                    style={{
                      left: labelInBar ? "8px" : `calc(${Math.max(pct, 4)}% + 6px)`,
                      color: labelInBar ? "white" : hasWait ? "#1B5E36" : "#9ca3af",
                    }}
                  >
                    {item.count}대
                  </span>
                </div>
                <span className="text-xs font-bold w-14 text-right flex-shrink-0" style={{ color: hasWait ? "#1B5E36" : "#d1d5db" }}>
                  {hasWait ? fmtMin(item.standtime) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
