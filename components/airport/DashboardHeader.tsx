"use client";

import { useState } from "react";
import type { HourlySlot, Terminal } from "@/lib/airport/types";

interface CongestionEntry {
  entrygate: string;
  korean: number;
  foreigner: number;
}

interface Props {
  terminal: Terminal;
  currentForeignWaiting: number;
  currentTotalWaiting: number;
  arrivalCongestion: CongestionEntry[];
  peakSlot: HourlySlot | null;
  now: string;
  tomorrowLabel: string;
}

export function DashboardHeader({
  currentForeignWaiting,
  currentTotalWaiting,
  arrivalCongestion,
  peakSlot,
  now,
  tomorrowLabel,
}: Props) {
  const [showGates, setShowGates] = useState(false);

  const domesticWaiting = currentTotalWaiting - currentForeignWaiting;

  const d = new Date(now);
  const isPeakTomorrow = d.getHours() >= 18 && peakSlot !== null && peakSlot.hour <= 5;
  const peakHour = peakSlot ? `${String(peakSlot.hour).padStart(2, "0")}시` : "—";
  const tomorrowDateLabel = tomorrowLabel
    ? `${parseInt(tomorrowLabel.split("/")[0])}월 ${parseInt(tomorrowLabel.split("/")[1])}일`
    : "";

  const gateMap = new Map<string, { foreigner: number; korean: number }>();
  for (const item of arrivalCongestion) {
    const gate = item.entrygate || "?";
    const prev = gateMap.get(gate) ?? { foreigner: 0, korean: 0 };
    gateMap.set(gate, { foreigner: prev.foreigner + item.foreigner, korean: prev.korean + item.korean });
  }
  const gates = [...gateMap.entries()]
    .filter(([, v]) => v.foreigner + v.korean > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const maxGate = Math.max(...gates.map(([, v]) => v.foreigner + v.korean), 1);

  return (
    <div className="grid grid-cols-[3fr_1.5fr] gap-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">입국장 대기</p>
          {gates.length > 0 && (
            <button
              onClick={() => setShowGates((v) => !v)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                showGates ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              입국장별
            </button>
          )}
        </div>

        {showGates ? (
          <div className="space-y-2 pt-1">
            {gates.map(([gate, { foreigner, korean }]) => {
              const total = foreigner + korean;
              const pct = Math.round((total / maxGate) * 100);
              const foreignPct = total > 0 ? Math.round((foreigner / total) * 100) : 0;
              return (
                <div key={gate} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 w-4 shrink-0">{gate}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full flex rounded-full overflow-hidden" style={{ width: `${pct}%` }}>
                      <div className="h-full bg-[#1B5E36]" style={{ width: `${foreignPct}%` }} />
                      <div className="h-full bg-[#81C784]" style={{ width: `${100 - foreignPct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-gray-500 w-12 text-right">{total.toLocaleString()}명</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">외국인</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold tabular-nums leading-none text-gray-900">
                  {currentForeignWaiting.toLocaleString()}
                </span>
                <span className="text-sm font-normal text-gray-500">명</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">내국인</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold tabular-nums leading-none text-gray-700">
                  {domesticWaiting.toLocaleString()}
                </span>
                <span className="text-sm font-normal text-gray-500">명</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <p className="text-sm text-gray-500 mb-2">다음 피크</p>
        <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">{peakHour}</p>
        <p className="text-xs text-gray-500 mt-2">
          {isPeakTomorrow && tomorrowDateLabel ? tomorrowDateLabel : ""}
        </p>
      </div>
    </div>
  );
}
