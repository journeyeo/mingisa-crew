"use client";

import { useState, useEffect } from "react";
import type { Flight, HourlySlot, Terminal, WeeklyDay } from "@/lib/airport/types";

import { DashboardHeader } from "@/components/airport/DashboardHeader";
import { TerminalToggle } from "@/components/airport/TerminalBasisToggle";
import { PassengerChart } from "@/components/airport/PassengerChart";
import { FlightListSlider } from "@/components/airport/FlightListSlider";
import { WeeklyForecast } from "@/components/airport/WeeklyForecast";
import { Footer } from "@/components/Footer";
import { FloatingScrollNav } from "@/components/FloatingScrollNav";

interface Props {
  terminal: Terminal;
}

// ─── Serialized API types ────────────────────────────────────────────────────

type SerializedFlight = Omit<Flight, "scheduledTime" | "landingTime" | "exitTime"> & {
  scheduledTime: string;
  landingTime: string;
  exitTime: string;
};

type SerializedSlot = Omit<HourlySlot, "flights"> & { flights: SerializedFlight[] };

interface SummaryData {
  slots: SerializedSlot[];
  peakSlot: SerializedSlot | null;
  currentForeignWaiting: number;
  currentTotalWaiting: number;
  todayStr: string;
  tomorrowStr: string;
  tomorrowLabel: string;
  kstHour: number;
  nowISO: string;
}

interface FlightsData {
  allSlots: SerializedSlot[];
  allSlotsLanding: SerializedSlot[];
  weeklyDays: WeeklyDay[];
  todayStr: string;
  tomorrowStr: string;
  kstHour: number;
}

function deserializeSlot(s: SerializedSlot): HourlySlot {
  return {
    ...s,
    flights: s.flights.map((f) => ({
      ...f,
      scheduledTime: new Date(f.scheduledTime),
      landingTime: new Date(f.landingTime),
      exitTime: new Date(f.exitTime),
    })),
  };
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

function HeaderSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-2">
          <Sk className="h-3 w-10" />
          <Sk className="h-10 w-16" />
          <Sk className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function PassengerSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
      <div className="flex gap-5 mb-4">
        {[0, 1, 2].map((i) => <Sk key={i} className="h-3 w-14" />)}
      </div>
      <div className="h-52 flex items-end gap-1">
        {[35, 55, 70, 45, 80, 60, 30, 50, 65, 40, 25, 45].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-sm" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

function FlightsSkeleton() {
  return (
    <div>
      <Sk className="h-4 w-32 mb-3" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-4 border-b border-gray-100 space-y-3">
          <Sk className="h-8 w-40" />
          <Sk className="h-3 w-20" />
          <Sk className="h-2 w-full rounded-full" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center px-4 py-3.5 gap-3 border-t border-gray-50">
            <Sk className="w-20 h-5" />
            <Sk className="flex-1 h-4" />
            <Sk className="w-24 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div>
      <Sk className="h-4 w-20 mb-3" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center px-4 py-3 gap-3">
            <Sk className="h-4 w-6" />
            <Sk className="flex-1 h-3" />
            <Sk className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AirportDashboard({ terminal }: Props) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [flights, setFlights] = useState<FlightsData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setSummary(null);
    setFlights(null);

    fetch(`/api/airport/summary?terminal=${terminal}`, { signal })
      .then((r) => r.json())
      .then((raw: SummaryData) => setSummary(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch(`/api/airport/flights?terminal=${terminal}`, { signal })
      .then((r) => r.json())
      .then((raw: FlightsData) => setFlights(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
  }, [terminal]);

  const now = new Date();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-lg mx-auto bg-white px-4 pt-5 pb-2">
        <h1 className="text-xl font-bold text-gray-900">인천공항 입국 수요</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          {" · 5분 갱신"}
          {summary && (() => {
            const t = new Date(summary.nowISO);
            const hh = String(t.getHours()).padStart(2, "0");
            const mm = String(t.getMinutes()).padStart(2, "0");
            return <span className="text-gray-400"> · {hh}:{mm} 업데이트</span>;
          })()}
        </p>
      </div>
      <div className="sticky top-0 z-50 max-w-lg mx-auto bg-white border-b border-gray-100 px-4">
        <TerminalToggle terminal={terminal} />
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 pb-4 space-y-8">

        {/* ── 빠른 섹션: 헤더 + 승객 예고 ── */}
        {!summary ? (
          <>
            <HeaderSkeleton />
            <div>
              <p className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
                승객 예고
              </p>
              <PassengerSkeleton />
            </div>
          </>
        ) : (
          <>
            <DashboardHeader
              terminal={terminal}
              currentForeignWaiting={summary.currentForeignWaiting}
              currentTotalWaiting={summary.currentTotalWaiting}
              peakSlot={summary.peakSlot ? deserializeSlot(summary.peakSlot) : null}
              now={summary.nowISO}
              tomorrowLabel={summary.tomorrowLabel}
            />
            <div>
              <p className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
                승객 예고
              </p>
              <PassengerChart slots={summary.slots.map(deserializeSlot)} tomorrowLabel={summary.tomorrowLabel} />
            </div>
          </>
        )}

        {/* ── 느린 섹션: 운항편 + 주간 예측 ── */}
        {!flights ? (
          <>
            <FlightsSkeleton />
            <WeeklySkeleton />
          </>
        ) : (
          <>
            <div>
              <p className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
                시간대별 운항편
              </p>
              <FlightListSlider
                key={terminal}
                terminal={terminal}
                slots={flights.allSlots.map(deserializeSlot)}
                slotsLanding={flights.allSlotsLanding.map(deserializeSlot)}
                todayStr={flights.todayStr}
                tomorrowStr={flights.tomorrowStr}
                kstHour={flights.kstHour}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
                <p className="text-xl font-bold text-gray-800">주간 예측</p>
                <span className="text-xs text-gray-500">(T1/T2 통합)</span>
              </div>
              <WeeklyForecast days={flights.weeklyDays} />
            </div>
          </>
        )}

        <p className="text-xs text-gray-400 pb-2">출처: 인천국제공항공사 공공데이터포털</p>
      </div>
      <Footer />
      <FloatingScrollNav />
    </main>
  );
}
