"use client";

import { useState, useMemo } from "react";
import type { HourlySlot } from "@/lib/airport/types";

interface Props {
  slots: HourlySlot[];
  todayStr: string;
  tomorrowStr: string;
  nowIdx: number;
}

function slotLabel(slot: HourlySlot | undefined, todayStr: string): string {
  if (!slot) return "--:00";
  const h = `${String(slot.hour).padStart(2, "0")}:00`;
  return slot.date && slot.date !== todayStr ? `익일 ${h}` : h;
}

function dateOf(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function TimeCell({ date, todayStr, prefix }: { date: Date; todayStr: string; prefix: string }) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const isNext = dateOf(date) !== todayStr;
  return (
    <span className="tabular-nums">
      {prefix} {hh}:{mm}
      {isNext && (
        <span className="inline-block text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1 rounded ml-0.5 leading-[1.4]">
          익일
        </span>
      )}
    </span>
  );
}

export function FlightListSlider({ slots, todayStr, tomorrowStr: _tomorrowStr, nowIdx }: Props) {
  const maxIdx = Math.max(0, slots.length - 1);
  const [startIdx, setStartIdx] = useState(() => nowIdx);
  const [endIdx, setEndIdx] = useState(() => Math.min(nowIdx + 6, maxIdx));
  const [priority, setPriority] = useState<"start" | "end">("end");
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  // null = 전체 선택, Set = 선택된 항공사만
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string> | null>(null);

  const startPct = maxIdx > 0 ? (startIdx / maxIdx) * 100 : 0;
  const endPct = maxIdx > 0 ? (endIdx / maxIdx) * 100 : 100;
  const nowPct = maxIdx > 0 ? Math.min((nowIdx / maxIdx) * 100, 100) : 0;

  // 전체 슬롯에서 항공사 목록 수집 (슬라이더 범위 변경과 무관하게 안정적)
  const allAirlines = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const slot of slots) {
      for (const flight of slot.flights) {
        if (flight.airline && !seen.has(flight.airline)) {
          seen.add(flight.airline);
          result.push(flight.airline);
        }
      }
    }
    return result.sort((a, b) => a.localeCompare(b, "ko"));
  }, [slots]);

  const isFiltered = selectedAirlines !== null;
  const selectedCount = selectedAirlines?.size ?? allAirlines.length;

  const selected = slots.slice(startIdx, endIdx + 1);
  const allEntries = selected.flatMap((s) =>
    s.flights
      .filter((f) => selectedAirlines === null || selectedAirlines.has(f.airline))
      .map((f) => ({ flight: f, isNoTransport: s.isNoTransport }))
  );
  const totalFlights = allEntries.length;

  function toggleAirline(airline: string) {
    setSelectedAirlines((prev) => {
      const base = prev ?? new Set(allAirlines);
      const next = new Set(base);
      if (next.has(airline)) next.delete(airline);
      else next.add(airline);
      return next.size === allAirlines.length ? null : next;
    });
  }

  function handleTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const clickIdx = Math.round(pct * maxIdx);
    setPriority(Math.abs(clickIdx - startIdx) <= Math.abs(clickIdx - endIdx) ? "start" : "end");
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 슬라이더 영역 */}
      <div className="px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-2xl font-bold tabular-nums text-gray-900">
              {slotLabel(slots[startIdx], todayStr)}
              <span className="text-gray-300 mx-2">–</span>
              {slotLabel(slots[endIdx], todayStr)}
            </p>
            <p className="text-sm mt-0.5 text-gray-400">
              {totalFlights > 0 ? `${totalFlights}편` : "운항편 없음"}
            </p>
          </div>

          <button
            onClick={() => { setShowFilter(true); setFilterQuery(""); }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              isFiltered
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            항공사
            {isFiltered && (
              <span className="ml-1 opacity-70">{selectedCount}/{allAirlines.length}</span>
            )}
          </button>
        </div>

        {/* 듀얼 썸 슬라이더 */}
        <div className="relative h-6 flex items-center" onPointerDown={handleTrackPointerDown}>
          <div className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full" />
          <div
            className="absolute h-2 rounded-full"
            style={{ background: "#C4933F", left: `${startPct}%`, right: `${100 - endPct}%` }}
          />
          {Math.abs(nowPct - startPct) > 8 && Math.abs(nowPct - endPct) > 8 && nowPct > 5 && nowPct < 95 && (
            <div
              className="absolute w-0.5 h-4 rounded-full pointer-events-none"
              style={{ background: "#C4933F", left: `${nowPct}%`, transform: "translateX(-50%)" }}
            />
          )}
          <input
            type="range" min={0} max={maxIdx} value={startIdx}
            onChange={(e) => { const v = Number(e.target.value); setStartIdx(Math.min(v, endIdx)); }}
            className="dual-thumb-input"
            style={{ zIndex: priority === "start" ? 5 : 3 }}
          />
          <input
            type="range" min={0} max={maxIdx} value={endIdx}
            onChange={(e) => { const v = Number(e.target.value); setEndIdx(Math.max(v, startIdx)); }}
            className="dual-thumb-input"
            style={{ zIndex: priority === "end" ? 5 : 3 }}
          />
        </div>

        {/* 눈금 */}
        <div className="relative mt-2 h-4 text-xs text-gray-400">
          <span className="absolute left-0">{slotLabel(slots[0], todayStr)}</span>
          {nowPct > 12 && nowPct < 88 && (
            <span
              className="absolute -translate-x-1/2 font-medium"
              style={{ color: "#C4933F", left: `${nowPct}%` }}
            >지금</span>
          )}
          <span className="absolute right-0">{slotLabel(slots[maxIdx], todayStr)}</span>
        </div>
      </div>

      {/* 항공편 목록 */}
      {totalFlights === 0 ? (
        <p className="px-4 py-6 text-gray-400 text-sm text-center">이 시간대 운항편 없음</p>
      ) : (
        <>
          <div className="flex items-center px-4 pt-2 pb-1 gap-3 text-xs text-gray-400">
            <span className="w-24 shrink-0">편명</span>
            <span className="flex-1">출발지</span>
            <span className="w-28 text-right">착륙 · 출구 도착</span>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-80">
            {allEntries.map(({ flight, isNoTransport }, i) => (
              <div
                key={`${flight.id}-${i}`}
                className={`flex items-center px-4 py-3.5 gap-3 ${flight.isDelayed ? "bg-rose-50/60" : isNoTransport ? "bg-amber-50/30" : ""}`}
              >
                <div className="w-24 shrink-0 flex flex-col items-start gap-0.5">
                  <span className="text-base font-mono font-bold text-gray-900">{flight.id}</span>
                  {flight.isDelayed && (
                    <span className="text-xs font-bold text-white bg-[#9B1B30] px-1.5 py-0.5 rounded-md leading-none">지연</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  {flight.airline && (
                    <span className="text-sm font-medium text-gray-700 truncate">{flight.airline}</span>
                  )}
                  <span className="text-xs text-gray-400 truncate">{flight.origin}</span>
                </div>
                <div className="w-28 text-right shrink-0">
                  <p className="text-xs text-gray-400">
                    <TimeCell date={flight.landingTime} todayStr={todayStr} prefix="착륙" />
                  </p>
                  {flight.isDelayed && (() => {
                    const delayMin = Math.round((flight.landingTime.getTime() - flight.scheduledTime.getTime()) / 60_000);
                    const sh = String(flight.scheduledTime.getHours()).padStart(2, "0");
                    const sm = String(flight.scheduledTime.getMinutes()).padStart(2, "0");
                    return (
                      <p className="text-[11px] text-gray-400 leading-tight">
                        예정 {sh}:{sm} <span className="text-rose-500 font-semibold">+{delayMin}분</span>
                      </p>
                    );
                  })()}
                  <p className={`text-base font-semibold leading-tight ${isNoTransport ? "text-[#9B1B30]" : "text-gray-900"}`}>
                    <TimeCell date={flight.exitTime} todayStr={todayStr} prefix="출구" />
                    {isNoTransport && (
                      <span className="ml-1 text-[10px] font-bold text-white bg-[#9B1B30] px-1 rounded leading-[1.4] align-middle">심야</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 항공사 필터 모달 */}
      {showFilter && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => { setShowFilter(false); setFilterQuery(""); }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-t-2xl w-full max-w-lg px-5 pt-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">항공사 선택</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAirlines(null)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 font-medium"
                >
                  전체 선택
                </button>
                <button
                  onClick={() => setSelectedAirlines(new Set())}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 font-medium"
                >
                  전체 해제
                </button>
              </div>
            </div>

            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="항공사 검색"
              className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 placeholder-gray-300"
              autoFocus
            />

            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {allAirlines.filter((a) => a.includes(filterQuery.trim())).map((airline) => {
                const checked = selectedAirlines === null || selectedAirlines.has(airline);
                return (
                  <label
                    key={airline}
                    className="flex items-center gap-3 px-1 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAirline(airline)}
                      className="w-4 h-4 rounded accent-gray-900"
                    />
                    <span className="text-sm text-gray-800">{airline}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
