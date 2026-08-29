"use client";

import { useState, useEffect, useRef } from "react";
import type { GimpoFlightsData, GimpoFlight } from "@/app/api/gimpo/route";

const TIME_BLOCKS = [
  { startH: 6,  endH: 8,  label: "06~08시" },
  { startH: 9,  endH: 11, label: "09~11시" },
  { startH: 12, endH: 14, label: "12~14시" },
  { startH: 15, endH: 17, label: "15~17시" },
  { startH: 18, endH: 20, label: "18~20시" },
  { startH: 21, endH: 23, label: "21~23시" },
] as const;

function currentBlockIdx(kstHour: number): number {
  if (kstHour < 6) return 0;
  return Math.min(Math.floor((kstHour - 6) / 3), TIME_BLOCKS.length - 1);
}

// ── 상태 배지 ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-300">-</span>;
  const color =
    status.includes("지연") ? "text-orange-500 bg-orange-50" :
    status.includes("결항") ? "text-red-500 bg-red-50" :
    status === "도착" || status === "출발" ? "text-gray-400 bg-gray-50" :
    "text-[#1B5E36] bg-[#1B5E36]/10";
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${color}`}>
      {status}
    </span>
  );
}

// ── 시간 포맷 ─────────────────────────────────────────────────────────────────

function fmtTime(hhmm: string): string {
  if (!hhmm || hhmm.length < 4) return hhmm;
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

// ── 편 행 ────────────────────────────────────────────────────────────────────

function FlightRow({ flight, isNow }: { flight: GimpoFlight; isNow: boolean }) {
  const isDelayed = flight.etd && flight.etd !== flight.std;
  const city = flight.io === "I" ? flight.fromCity : flight.toCity;

  return (
    <div
      className={`flex items-center px-4 py-3.5 border-b border-gray-50 ${
        isNow ? "bg-[#1B5E36]/5" : ""
      }`}
    >
      {/* 시간 */}
      <div className="w-16 flex-shrink-0">
        <p className={`text-base font-bold tabular-nums ${isDelayed ? "line-through text-gray-300" : "text-gray-900"}`}>
          {fmtTime(flight.std)}
        </p>
        {isDelayed && (
          <p className="text-base font-bold tabular-nums text-orange-500">
            {fmtTime(flight.etd!)}
          </p>
        )}
      </div>

      {/* 항공사 + 편명 */}
      <div className="flex-1 min-w-0 px-2">
        <p className="text-base font-semibold text-gray-900 truncate">{city}</p>
        <p className="text-sm text-gray-400 tabular-nums">{flight.flightId} · {flight.airline}</p>
      </div>

      {/* 게이트/수하물 */}
      <div className="text-right w-11 flex-shrink-0 mr-2">
        {flight.io === "O" && flight.gate && (
          <p className="text-sm text-gray-500 font-medium">{flight.gate}번</p>
        )}
        {flight.io === "I" && flight.baggage && (
          <p className="text-sm text-gray-500 font-medium">{flight.baggage}번</p>
        )}
      </div>

      {/* 상태 */}
      <div className="flex-shrink-0 w-20 text-right">
        <StatusBadge status={flight.status} />
      </div>
    </div>
  );
}

// ── 현재 시간 구분선 ──────────────────────────────────────────────────────────

function NowDivider() {
  return (
    <div className="flex items-center px-4 py-1 bg-[#1B5E36]/5">
      <div className="flex-1 h-px bg-[#1B5E36]/30" />
      <span className="text-xs text-[#1B5E36] font-medium px-2">지금</span>
      <div className="flex-1 h-px bg-[#1B5E36]/30" />
    </div>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

function ListSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center px-4 py-3.5 gap-3 border-b border-gray-50">
          <Sk className="w-12 h-4" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3.5 w-24" />
            <Sk className="h-3 w-20" />
          </div>
          <Sk className="w-10 h-4" />
        </div>
      ))}
    </div>
  );
}

// ── 메인 뷰 ──────────────────────────────────────────────────────────────────

export function GimpoView() {
  const [data, setData] = useState<GimpoFlightsData | null>(null);
  const [tab, setTab] = useState<"arrival" | "depart">("arrival");
  const nowRef = useRef<HTMLDivElement>(null);

  // 현재 시각 (KST)
  const kstNow = new Date(new Date().getTime() + 9 * 3600_000);
  const kstHour = kstNow.getUTCHours();
  const nowHHMM = `${String(kstHour).padStart(2, "0")}${String(kstNow.getUTCMinutes()).padStart(2, "0")}`;

  const [selectedBlock, setSelectedBlock] = useState<number>(() => currentBlockIdx(kstHour));

  useEffect(() => {
    fetch("/api/gimpo")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  // 블록·탭 변경 시: 현재 시간대면 "지금"으로 스크롤, 아니면 맨 위로
  useEffect(() => {
    if (!data) return;
    if (blockContainsNow) {
      setTimeout(() => {
        nowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } else {
      (document.scrollingElement ?? document.documentElement).scrollTo({ top: 0, behavior: "instant" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlock, tab, data]);

  const block = TIME_BLOCKS[selectedBlock];

  const flights = data
    ? (tab === "arrival" ? data.arrivals : data.departures)
        .filter((f) => f.date === data.todayStr)
        .filter((f) => {
          const h = parseInt(f.std.slice(0, 2), 10);
          return h >= block.startH && h <= block.endH;
        })
    : [];

  const blockContainsNow = kstHour >= block.startH && kstHour <= block.endH;
  let nowInserted = false;

  return (
    <div style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
      {/* 도착/출발 + 시간 블록 + 섹션헤더 + 컬럼헤더 — sticky */}
      <div
        className="sticky z-40 bg-gray-50"
        style={{ top: "var(--sticky-header-height, 0px)" }}
      >
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2 space-y-2">
          {/* 도착/출발 탭 */}
          <div className="flex gap-2">
            {(["arrival", "depart"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                  tab === t
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200 text-gray-500"
                }`}
              >
                {t === "arrival" ? "도착" : "출발"}
              </button>
            ))}
          </div>
          {/* 시간 블록 */}
          <div className="grid grid-cols-3 gap-1.5">
            {TIME_BLOCKS.map(({ label }, idx) => {
              const isCurrent = idx === currentBlockIdx(kstHour);
              const isSelected = idx === selectedBlock;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedBlock(idx)}
                  className={`py-2 rounded-xl text-sm font-semibold text-center transition-colors border-2 ${
                    isSelected
                      ? "bg-[#1B5E36] text-white border-transparent"
                      : isCurrent
                      ? "bg-gray-100 text-gray-600 border-dashed border-[#1B5E36]"
                      : "bg-gray-100 text-gray-500 border-transparent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 섹션 헤더 */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex items-center gap-1.5">
          <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
          <h2 className="text-xl font-bold text-gray-800">
            {tab === "arrival" ? "도착 편" : "출발 편"}
          </h2>
          {data && (
            <span className="text-sm text-gray-400 ml-1">{block.label} {flights.length}편</span>
          )}
        </div>
        {/* 컬럼 헤더 */}
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-t-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center text-sm font-semibold text-gray-400 border-b border-gray-100">
            <span className="w-16">시간</span>
            <span className="flex-1 pl-2">{tab === "arrival" ? "출발지" : "목적지"}</span>
            <span className="w-11 mr-2 text-right">{tab === "arrival" ? "수하물" : "게이트"}</span>
            <span className="w-20 text-right">상태</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* 리스트 */}
        {!data ? (
          <ListSkeleton />
        ) : flights.length === 0 ? (
          <div className="bg-white rounded-b-2xl border-x border-b border-gray-100 shadow-sm px-4 py-10 text-center text-gray-400 text-sm">
            이 시간대 운항편 없음
          </div>
        ) : (
          <div className="bg-white rounded-b-2xl border-x border-b border-gray-100 shadow-sm overflow-hidden">
            {flights.map((flight, idx) => {
              const isPast = flight.std < nowHHMM;
              const showNow = blockContainsNow && !nowInserted && !isPast;
              if (showNow) nowInserted = true;

              return (
                <div key={`${flight.date}_${flight.io}_${flight.flightId}_${idx}`}>
                  {showNow && <div ref={nowRef}><NowDivider /></div>}
                  <FlightRow flight={flight} isNow={false} />
                </div>
              );
            })}
          </div>
        )}

        {/* 출처 */}
        {data && (
          <p className="text-center text-xs text-gray-300 mt-3">
            한국공항공사 실시간 운항정보 · 5분 갱신
          </p>
        )}
      </div>
    </div>
  );
}
