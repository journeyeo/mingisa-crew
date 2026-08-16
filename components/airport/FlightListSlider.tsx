"use client";

import { Fragment, useState, useMemo, useRef, useEffect } from "react";
import type { HourlySlot } from "@/lib/airport/types";

// 대형항공사 키워드 (포함 여부로 판단)
const MAJOR_KEYWORDS = [
  "대한항공", "아시아나",
  "중국국제", "중국동방", "중국남방", "하이난", "샤먼", "사천",
  "캐세이", "홍콩익스프레스",
  "싱가포르", "말레이시아", "타이항공", "에어아시아", "필리핀", "베트남",
  "일본항공", "전일본", "피치",
  "가루다", "바틱",
  "에미레이트", "카타르", "에티하드", "터키항공", "이스라엘",
  "루프트한자", "영국항공", "에어프랑스", "KLM", "핀에어", "스칸디나비아",
  "유나이티드", "아메리칸", "델타", "에어캐나다",
  "에어인디아", "비스타라",
];
const isMajorAirline = (name: string) => MAJOR_KEYWORDS.some((k) => name.includes(k));

const FLIGHT_MINUTES: Record<string, number> = {
  NRT:130, HND:130, KIX:135, FUK:115, CTS:145, OKA:175, NGO:130, SDJ:155, KOJ:160, OIT:140,
  PEK:200, PKX:200, PVG:185, SHA:185, TAO:110, DLC:90, SHE:90, CGO:130, WUH:140, CSX:155,
  HGH:160, NKG:150, TNA:115, TYN:145, HET:185, HRB:150, SJW:130,
  HKG:215, MFM:215, TPE:175, KHH:200,
  CAN:210, SZX:210, XMN:190, CTU:250, CKG:260, XIY:225, KMG:270, URC:330,
  ULN:195, VVO:195, KHV:185, YKS:245,
  MNL:250, HAN:260, SGN:305, BKK:360, DMK:360, CNX:375, REP:355, VTE:325,
  KUL:360, SIN:375, CGK:390, DPS:390, RGN:365, MDL:350,
  DAC:330, DEL:475, BOM:500, KTM:420, CMB:515, CCU:360, MAA:550, HYD:540, BLR:560,
  ALA:430, TAS:445, FRU:440, GYD:525,
  SVO:580, DME:580, LED:615,
  DXB:545, DOH:570, AUH:585, BAH:590, KWI:585, MCT:575, RUH:590,
  AMM:615, CAI:625, TLV:625, IST:665, SAW:665,
  CDG:695, FRA:715, LHR:700, AMS:715, ZRH:720, MUC:715, VIE:720,
  FCO:735, MAD:745, BCN:735, BRU:720, CPH:725, ARN:740, OSL:745,
  WAW:720, PRG:715, BUD:720,
  LAX:635, SFO:645, SEA:605, YVR:605, JFK:810, ORD:825, YYZ:845, YYC:645,
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
  const long = h >= 7, mid = h >= 3;
  return (
    <span
      className="text-xs font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
      style={long ? { background: "#FFF3E0", color: "#E65100" }
           : mid  ? { background: "#E8F5E9", color: "#BF360C" }
                  : { background: "#F4F4F5", color: "#71717A" }}
    >약 {h}시간 비행</span>
  );
}

// 8 fixed 3-hour blocks (00~02 and 03~05 are tomorrow's, 06~23 are today's)
const FIXED_BLOCKS = [
  { startH: 0,  endH: 2,  label: "00~02시" },
  { startH: 3,  endH: 5,  label: "03~05시" },
  { startH: 6,  endH: 8,  label: "06~08시" },
  { startH: 9,  endH: 11, label: "09~11시" },
  { startH: 12, endH: 14, label: "12~14시" },
  { startH: 15, endH: 17, label: "15~17시" },
  { startH: 18, endH: 20, label: "18~20시" },
  { startH: 21, endH: 23, label: "21~23시" },
] as const;

interface Props {
  slots: HourlySlot[];
  slotsLanding: HourlySlot[];
  todayStr: string;
  tomorrowStr: string;
  kstHour: number;
  terminal: string;
}

function dateOf(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

const NextDayBadge = () => (
  <span className="inline-block text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1 rounded ml-0.5 leading-[1.4]">
    익일
  </span>
);

function TimeCell({ date, todayStr, prefix, hideNextDay }: { date: Date; todayStr: string; prefix: string; hideNextDay?: boolean }) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const isNext = !hideNextDay && dateOf(date) !== todayStr;
  return (
    <span className="tabular-nums">
      {prefix} {hh}:{mm}
      {isNext && <NextDayBadge />}
    </span>
  );
}

export function FlightListSlider({ slots, slotsLanding, todayStr, tomorrowStr, kstHour, terminal }: Props) {
  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<string> | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [basis, setBasis] = useState<"exit" | "landing">("landing");

  // Slot indices for each fixed block:
  // Blocks 0-1 (00~05시) → tomorrowStr slots; Blocks 2-7 (06~23시) → todayStr slots
  const fixedBlockSlotIndices = useMemo(() => {
    return FIXED_BLOCKS.map(({ startH, endH }, blockIdx) => {
      const targetDate = (blockIdx < 2 && kstHour >= 6) ? tomorrowStr : todayStr;
      return slots.reduce<number[]>((acc, slot, i) => {
        if (slot.date === targetDate && slot.hour >= startH && slot.hour <= endH) acc.push(i);
        return acc;
      }, []);
    });
  }, [slots, todayStr, tomorrowStr, kstHour]);

  // Block containing current hour (0~7)
  const currentBlockIdx = Math.floor(kstHour / 3);

  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(
    () => new Set([currentBlockIdx])
  );

  function scrollToListTop() {
    if (listRef.current) listRef.current.scrollTop = 0;
    if (!timeCardRef.current || !flightListCardRef.current) return;
    const timeCardRect = timeCardRef.current.getBoundingClientRect();
    if (timeCardRect.top > 51) return;
    const targetViewportTop = timeCardRect.bottom + 8;
    const currentViewportTop = flightListCardRef.current.getBoundingClientRect().top;
    const scrollDelta = currentViewportTop - targetViewportTop;
    if (Math.abs(scrollDelta) > 5) {
      window.scrollTo({ top: Math.max(0, window.scrollY + scrollDelta), behavior: "smooth" });
    }
  }

  function toggleGroup(groupIdx: number) {
    scrollToListTop();
    setSelectedGroups(new Set([groupIdx]));
  }

  function changeBasis(b: "exit" | "landing") {
    scrollToListTop();
    setBasis(b);
  }

  const selectedSlotSet = useMemo(() => {
    const s = new Set<number>();
    for (const blockIdx of selectedGroups) {
      fixedBlockSlotIndices[blockIdx]?.forEach((i) => s.add(i));
    }
    return s;
  }, [selectedGroups, fixedBlockSlotIndices]);

  const allAirlines = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const slot of slots) {
      for (const f of slot.flights) {
        if (f.airline && !seen.has(f.airline)) { seen.add(f.airline); result.push(f.airline); }
      }
    }
    return result.sort((a, b) => a.localeCompare(b, "ko"));
  }, [slots]);

  const effectiveSlots = basis === "exit" ? slots : slotsLanding;

  const selected = effectiveSlots.filter((_, idx) => selectedSlotSet.has(idx));

  const isFiltered = selectedAirlines !== null;
  const selectedCount = selectedAirlines?.size ?? allAirlines.length;

  const allEntries = (() => {
    const raw = selected.flatMap((s) =>
      s.flights
        .filter((f) => selectedAirlines === null || selectedAirlines.has(f.airline))
        .map((f) => ({ flight: f, isNoTransport: s.isNoTransport }))
    );
    const seen = new Map<string, { flight: typeof raw[0]["flight"]; ids: string[]; isNoTransport: boolean }>();
    for (const entry of raw) {
      const key = `${entry.flight.scheduledTime.getTime()}-${entry.flight.origin}`;
      if (seen.has(key)) seen.get(key)!.ids.push(entry.flight.id);
      else seen.set(key, { flight: entry.flight, ids: [entry.flight.id], isNoTransport: entry.isNoTransport });
    }
    return Array.from(seen.values());
  })();
  const totalFlights = allEntries.length;

  // "지금" 구분선: 현재 시각 기준 첫 미래 항공편 위치
  const now = new Date();
  const nowDividerIdx = useMemo(() => {
    const idx = allEntries.findIndex(({ flight }) =>
      basis === "exit" ? flight.exitTime >= now : flight.landingTime >= now
    );
    return idx >= 0 ? idx : allEntries.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntries, basis]);

  const listRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const timeCardRef = useRef<HTMLDivElement>(null);
  const flightListCardRef = useRef<HTMLDivElement>(null);

  const isCurrentBlockSelected = selectedGroups.has(currentBlockIdx);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (isCurrentBlockSelected && dividerRef.current) {
      list.scrollTop = Math.max(0, dividerRef.current.offsetTop - list.offsetTop - 8);
    } else {
      list.scrollTop = 0;
    }
  }, [selectedGroups, isCurrentBlockSelected, basis]);

  function toggleAirline(airline: string) {
    setSelectedAirlines((prev) => {
      const base = prev ?? new Set(allAirlines);
      const next = new Set(base);
      if (next.has(airline)) next.delete(airline); else next.add(airline);
      return next.size === allAirlines.length ? null : next;
    });
  }

  // 00~05시 블록은 kstHour >= 6일 때만 익일 (자정~새벽엔 오늘로 표시)
  const isNextDay = (blockIdx: number) => blockIdx < 2 && kstHour >= 6;

  return (
    <>
    <div className="flex items-center justify-between px-1 mb-2">
      <p className="text-base font-bold text-gray-800 tabular-nums">
        {totalFlights > 0 ? `${totalFlights}편` : "—"}
      </p>
      <button
        onClick={() => { setShowFilter(true); setFilterQuery(""); }}
        className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-colors ${
          isFiltered ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
        }`}
      >
        항공사{isFiltered && <span className="ml-1 opacity-70">{selectedCount}/{allAirlines.length}</span>}
      </button>
    </div>

    <div ref={timeCardRef} className="sticky top-[50px] z-40 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-xs font-semibold">
          {(["exit", "landing"] as const).map((b) => (
            <button key={b} onClick={() => changeBasis(b)}
              className={`px-2.5 py-1.5 transition-colors ${basis === b ? "bg-gray-800 text-white" : "bg-white text-gray-600"}`}>
              {b === "exit" ? "출구기준" : "착륙기준"}
            </button>
          ))}
        </div>
        {!isCurrentBlockSelected && (
          <button
            onClick={() => setSelectedGroups(new Set([currentBlockIdx]))}
            className="text-sm font-bold px-3 py-1.5 rounded-xl text-white shrink-0"
            style={{ background: "#E65100" }}
          >
            지금으로
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FIXED_BLOCKS.map(({ label }, blockIdx) => {
          const isSelected = selectedGroups.has(blockIdx);
          return (
            <button
              key={blockIdx}
              onClick={() => toggleGroup(blockIdx)}
              className={`py-2 rounded-xl text-sm font-semibold text-center transition-colors ${
                isSelected ? "bg-[#1B5E36] text-white"
                : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>

    {totalFlights === 0 ? (
      <div ref={flightListCardRef} className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="px-4 py-6 text-gray-400 text-sm text-center">이 시간대 운항편 없음</p>
      </div>
    ) : (
      <div ref={flightListCardRef} className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center px-4 pt-2 pb-1 gap-3 text-sm font-semibold text-gray-600">
          <span className="w-20 shrink-0">편명</span>
          <span className="flex-1">출발지</span>
          <span className="w-28 text-right">착륙 · 출구 도착</span>
        </div>
        <div ref={listRef} className="divide-y divide-gray-100 overflow-y-auto max-h-[36rem]">
          {allEntries.map(({ flight, ids, isNoTransport }, i) => {
              const primaryId = ids[0];
              const extraIds = ids.slice(1);
              const isExpanded = expandedIds.has(primaryId);
              return (
                <Fragment key={`${primaryId}-${i}`}>
                  {i === nowDividerIdx && isCurrentBlockSelected && (
                    <div
                      ref={dividerRef}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 sticky top-0 z-10"
                    >
                      <span className="text-sm font-bold px-2.5 py-0.5 rounded-full text-white leading-none" style={{ background: "#1B5E36" }}>지금</span>
                      <span className="text-sm text-[#BF360C] font-semibold">이후 도착편</span>
                    </div>
                  )}
                  <div className={`flex items-start px-4 py-3 gap-3 ${flight.isDelayed ? "bg-orange-50/60" : isNoTransport ? "bg-orange-50/30" : ""}`}>
                    <div className="w-20 shrink-0 flex flex-col items-start gap-0.5 pt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-mono font-bold text-gray-900 leading-tight">{primaryId}</span>
                        {extraIds.length > 0 && !isExpanded && (
                          <button onClick={() => setExpandedIds((s) => new Set(s).add(primaryId))}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">
                            +{extraIds.length}
                          </button>
                        )}
                      </div>
                      {extraIds.length > 0 && isExpanded && (
                        <div className="flex flex-col gap-0.5">
                          {extraIds.map((id) => <span key={id} className="text-xs font-mono text-gray-500 leading-tight">{id}</span>)}
                          <button onClick={() => setExpandedIds((s) => { const n = new Set(s); n.delete(primaryId); return n; })}
                            className="text-[10px] text-gray-400 leading-tight text-left">접기</button>
                        </div>
                      )}
                      {flight.airline && <span className="text-sm font-medium text-gray-600 leading-tight truncate w-full">{flight.airline.replace("항공", "").trim()}</span>}
                    </div>

                    <div className="flex-1 flex flex-col items-start justify-center min-w-0 gap-0.5 pt-0.5">
                      <span className="text-base font-semibold text-gray-900 truncate w-full">{flight.origin}</span>
                      <DurationBadge code={flight.airportCode} />
                    </div>

                    <div className="shrink-0 text-right space-y-0.5">
                      {flight.isDelayed ? (() => {
                        const isLate = flight.landingTime.getTime() > flight.scheduledTime.getTime();
                        const sh = String(flight.scheduledTime.getHours()).padStart(2, "0");
                        const sm = String(flight.scheduledTime.getMinutes()).padStart(2, "0");
                        const lh = String(flight.landingTime.getHours()).padStart(2, "0");
                        const lm = String(flight.landingTime.getMinutes()).padStart(2, "0");
                        const isNextDay = dateOf(flight.scheduledTime) !== todayStr;
                        return (
                          <>
                            <p className="text-sm tabular-nums whitespace-nowrap text-gray-500">
                              착륙예정 {sh}:{sm}{isNextDay && <NextDayBadge />}
                            </p>
                            <p className="text-base tabular-nums font-bold whitespace-nowrap flex items-center justify-end gap-1">
                              <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-md leading-none ${isLate ? "bg-[#E65100]" : "bg-blue-400"}`}>
                                {isLate ? "지연" : "단축"}
                              </span>
                              <span>착륙 </span>
                              <span className="text-gray-900">{lh}:{lm}</span>
                            </p>
                          </>
                        );
                      })() : (
                        <p className="text-base text-gray-900 font-medium whitespace-nowrap">
                          <TimeCell date={flight.landingTime} todayStr={todayStr} prefix="착륙" />
                        </p>
                      )}
                      <p className={`text-base font-semibold whitespace-nowrap ${"text-gray-900"}`}>
                        <TimeCell date={flight.exitTime} todayStr={todayStr} prefix={flight.exitGate ? `출구 ${flight.exitGate}` : "출구"} hideNextDay />
                        {isNoTransport && <span className="ml-1 text-[10px] font-bold text-white bg-[#E65100] px-1 rounded leading-[1.4] align-middle">심야</span>}
                      </p>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowFilter(false); setFilterQuery(""); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-t-2xl w-full max-w-lg px-5 pt-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900 mb-3">항공사 선택</p>
            <div className="flex gap-2 mb-3">
              {[
                { label: "전체 선택", fn: () => setSelectedAirlines(null) },
                { label: "대형항공사", fn: () => setSelectedAirlines(new Set(allAirlines.filter(isMajorAirline))) },
                { label: "전체 해제", fn: () => setSelectedAirlines(new Set()) },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn}
                  className="text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 bg-gray-50">
                  {label}
                </button>
              ))}
            </div>
            <input type="text" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="항공사 검색"
              className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 placeholder-gray-300"
              autoFocus />
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {allAirlines.filter((a) => a.includes(filterQuery.trim())).map((airline) => {
                const checked = selectedAirlines === null || selectedAirlines.has(airline);
                return (
                  <label key={airline} className="flex items-center gap-3 px-1 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={checked} onChange={() => toggleAirline(airline)} className="w-4 h-4 rounded accent-gray-900" />
                    <span className="text-sm text-gray-800">{airline}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
