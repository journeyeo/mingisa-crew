"use client";

import { useState, useMemo } from "react";
import type { HourlySlot } from "@/lib/airport/types";

// IATA 코드 → 인천 기준 편도 비행시간(분) 추정
const FLIGHT_MINUTES: Record<string, number> = {
  // 일본 (~2h)
  NRT:130, HND:130, KIX:135, FUK:115, CTS:145, OKA:175, NGO:130, SDJ:155, KOJ:160, OIT:140,
  // 중국 근거리 (~2-3h)
  PEK:200, PKX:200, PVG:185, SHA:185, TAO:110, DLC:90, SHE:90, CGO:130, WUH:140, CSX:155,
  HGH:160, NKG:150, TNA:115, TYN:145, HET:185, HRB:150, SJW:130,
  // 홍콩·마카오·대만 (~3h)
  HKG:215, MFM:215, TPE:175, KHH:200,
  // 중국 서부 (~3.5-4h)
  CAN:210, SZX:210, XMN:190, CTU:250, CKG:260, XIY:225, KMG:270, URC:330,
  // 몽골·러시아 극동 (~2.5-3h)
  ULN:195, VVO:195, KHV:185, YKS:245,
  // 동남아 (~4-6h)
  MNL:250, HAN:260, SGN:305, BKK:360, DMK:360, CNX:375, REP:355, VTE:325,
  KUL:360, SIN:375, CGK:390, DPS:390, RGN:365, MDL:350,
  // 남아시아 (~6-8h)
  DAC:330, DEL:475, BOM:500, KTM:420, CMB:515, CCU:360, MAA:550, HYD:540, BLR:560,
  // 중앙아시아 (~7h)
  ALA:430, TAS:445, FRU:440, GYD:525,
  // 러시아 서부 (~9h)
  SVO:580, DME:580, LED:615,
  // 중동 (~9-10h)
  DXB:545, DOH:570, AUH:585, BAH:590, KWI:585, MCT:575, RUH:590,
  AMM:615, CAI:625, TLV:625, IST:665, SAW:665,
  // 유럽 (~11-13h)
  CDG:695, FRA:715, LHR:700, AMS:715, ZRH:720, MUC:715, VIE:720,
  FCO:735, MAD:745, BCN:735, BRU:720, CPH:725, ARN:740, OSL:745,
  WAW:720, PRG:715, BUD:720,
  // 미주 (~12-14h)
  LAX:635, SFO:645, SEA:605, YVR:605, JFK:810, ORD:825, YYZ:845, YYC:645,
  // 오세아니아 (~10h)
  SYD:665, MEL:695, BNE:665, AKL:770,
};

function estimateHours(code?: string): number | null {
  if (!code) return null;
  const min = FLIGHT_MINUTES[code.toUpperCase()];
  return min ? Math.round(min / 60) : null;
}

function DurationBadge({ code }: { code?: string }) {
  const h = estimateHours(code);
  if (!h) return null;
  const long = h >= 7;
  const mid = h >= 3;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none"
      style={
        long
          ? { background: "#FDF0F2", color: "#9B1B30" }
          : mid
          ? { background: "#FDF3DE", color: "#9A7020" }
          : { background: "#F4F4F5", color: "#71717A" }
      }
    >
      약 {h}h 비행
    </span>
  );
}

interface Props {
  slots: HourlySlot[];
  todayStr: string;
  tomorrowStr: string;
  nowIdx: number;
  terminal: string;
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

export function FlightListSlider({ slots, todayStr, tomorrowStr: _tomorrowStr, nowIdx, terminal }: Props) {
  const maxIdx = Math.max(0, slots.length - 1);
  const [startIdx, setStartIdx] = useState(() => nowIdx);
  const [endIdx, setEndIdx] = useState(() => Math.min(nowIdx + 6, maxIdx));
  const [priority, setPriority] = useState<"start" | "end">("end");
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string> | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  // 공동운항(코드쉐어) 중복 제거: scheduledTime + origin이 같으면 동일 항공기
  const allEntries = (() => {
    const raw = selected.flatMap((s) =>
      s.flights
        .filter((f) => selectedAirlines === null || selectedAirlines.has(f.airline))
        .map((f) => ({ flight: f, isNoTransport: s.isNoTransport }))
    );
    const seen = new Map<string, { flight: typeof raw[0]["flight"]; ids: string[]; isNoTransport: boolean }>();
    for (const entry of raw) {
      const key = `${entry.flight.scheduledTime.getTime()}-${entry.flight.origin}`;
      if (seen.has(key)) {
        seen.get(key)!.ids.push(entry.flight.id);
      } else {
        seen.set(key, { flight: entry.flight, ids: [entry.flight.id], isNoTransport: entry.isNoTransport });
      }
    }
    return Array.from(seen.values());
  })();
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
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#9B1B30]">{terminal}</span>
              <p className="text-2xl font-bold tabular-nums text-gray-900">
                {slotLabel(slots[startIdx], todayStr)}
                <span className="text-gray-300 mx-2">–</span>
                {slotLabel(slots[endIdx], todayStr)}
              </p>
            </div>
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
            <span className="w-20 shrink-0">편명</span>
            <span className="flex-1">출발지</span>
            <span className="w-28 text-right">착륙 · 출구 도착</span>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-80">
            {allEntries.map(({ flight, ids, isNoTransport }, i) => {
              const primaryId = ids[0];
              const extraIds = ids.slice(1);
              const isExpanded = expandedIds.has(primaryId);
              return (
                <div
                  key={`${primaryId}-${i}`}
                  className={`flex items-start px-4 py-3 gap-3 ${flight.isDelayed ? "bg-rose-50/60" : isNoTransport ? "bg-amber-50/30" : ""}`}
                >
                  {/* 편명 열 */}
                  <div className="w-20 shrink-0 flex flex-col items-start gap-0.5 pt-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono font-bold text-gray-900 leading-tight">{primaryId}</span>
                      {extraIds.length > 0 && !isExpanded && (
                        <button
                          onClick={() => setExpandedIds((s) => new Set(s).add(primaryId))}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 leading-none"
                        >+{extraIds.length}</button>
                      )}
                    </div>
                    {extraIds.length > 0 && isExpanded && (
                      <div className="flex flex-col gap-0.5">
                        {extraIds.map((id) => (
                          <span key={id} className="text-xs font-mono text-gray-400 leading-tight">{id}</span>
                        ))}
                        <button
                          onClick={() => setExpandedIds((s) => { const n = new Set(s); n.delete(primaryId); return n; })}
                          className="text-[10px] text-gray-300 leading-tight text-left"
                        >접기</button>
                      </div>
                    )}
                    {flight.isDelayed && (
                      <span className="text-[10px] font-bold text-white bg-[#9B1B30] px-1.5 py-0.5 rounded-md leading-none mt-0.5">지연</span>
                    )}
                  </div>

                  {/* 출발지 열 */}
                  <div className="flex-1 flex flex-col justify-center min-w-0 gap-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">{flight.origin}</span>
                      <DurationBadge code={flight.airportCode} />
                    </div>
                    {flight.airline && (
                      <span className="text-xs text-gray-400 truncate">{flight.airline}</span>
                    )}
                  </div>

                  {/* 시각 열 */}
                  <div className="w-28 text-right shrink-0">
                    {flight.exitGate && (
                      <p className="text-xs text-gray-400 mb-0.5">출구 {flight.exitGate}</p>
                    )}
                    <p className="text-sm text-gray-500 font-medium">
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
              );
            })}
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
