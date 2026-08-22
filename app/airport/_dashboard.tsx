"use client";

import { useState, useEffect, useRef } from "react";
import type { Flight, HourlySlot, Terminal, WeeklyDay } from "@/lib/airport/types";

import { DashboardHeader } from "@/components/airport/DashboardHeader";
import { TerminalToggle } from "@/components/airport/TerminalBasisToggle";
import { PassengerChart } from "@/components/airport/PassengerChart";
import { FlightListSlider } from "@/components/airport/FlightListSlider";
import { WeeklyForecast } from "@/components/airport/WeeklyForecast";
import { TaxiStatusCard } from "@/components/airport/TaxiStatus";
import { Footer } from "@/components/Footer";
import type { TaxiStatus } from "@/app/api/airport/taxi/route";

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

interface ArrivalCongestionEntry {
  flightid: string;
  entrygate: string;
  airport: string;
  gatenumber: string;
  korean: number;
  foreigner: number;
  scheduletime: string;
  estimatedtime: string;
}

interface SummaryData {
  slots: SerializedSlot[];
  peakSlot: SerializedSlot | null;
  currentForeignWaiting: number;
  currentTotalWaiting: number;
  arrivalCongestion: ArrivalCongestionEntry[];
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3 h-full flex flex-col">
      <div className="flex gap-5 mb-4 flex-shrink-0">
        {[0, 1, 2].map((i) => <Sk key={i} className="h-3 w-14" />)}
      </div>
      <div className="flex-1 min-h-0 flex items-end gap-1">
        {[35, 55, 70, 45, 80, 60, 30, 50, 65, 40, 25, 45].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-sm" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full overflow-y-auto divide-y divide-gray-50">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center px-4 py-3 gap-3">
          <Sk className="h-4 w-6" />
          <Sk className="flex-1 h-3" />
          <Sk className="h-4 w-10" />
        </div>
      ))}
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

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AirportDashboard({ terminal }: Props) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [flights, setFlights] = useState<FlightsData | null>(null);
  const [taxiT1, setTaxiT1] = useState<TaxiStatus | null>(null);
  const [taxiT2, setTaxiT2] = useState<TaxiStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"passenger" | "weekly">("passenger");
  const [bottomTab, setBottomTab] = useState<"status" | "flights">("flights");
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--sticky-header-height", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setSummary(null);
    setFlights(null);
    setTaxiT1(null);
    setTaxiT2(null);

    fetch(`/api/airport/summary?terminal=${terminal}`, { signal })
      .then((r) => r.json())
      .then((raw: SummaryData) => setSummary(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch(`/api/airport/flights?terminal=${terminal}`, { signal })
      .then((r) => r.json())
      .then((raw: FlightsData) => setFlights(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch(`/api/airport/taxi?terminal=T1`, { signal })
      .then((r) => r.json())
      .then((raw: TaxiStatus) => setTaxiT1(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch(`/api/airport/taxi?terminal=T2`, { signal })
      .then((r) => r.json())
      .then((raw: TaxiStatus) => setTaxiT2(raw))
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
  }, [terminal]);

  const now = new Date();

  function scrollToTop() {
    (document.scrollingElement ?? document.documentElement).scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div
        ref={headerRef}
        className="sticky top-0 z-50 max-w-lg mx-auto bg-white border-b border-gray-100 px-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="pt-4 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={scrollToTop} className="flex-shrink-0">
              <img src="/app-icon-crew-512.png" alt="민기사 크루" className="w-7 h-7 rounded-lg object-contain" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">인천공항 입국 수요</h1>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            {" · 5분 갱신"}
            {summary && (() => {
              const kst = new Date(new Date(summary.nowISO).getTime() + 9 * 3600_000);
              const hh = String(kst.getUTCHours()).padStart(2, "0");
              const mm = String(kst.getUTCMinutes()).padStart(2, "0");
              return <span className="text-gray-400"> · {hh}:{mm} 업데이트</span>;
            })()}
          </p>
        </div>
        <TerminalToggle terminal={terminal} />
      </div>
      {/* ── 현황 탭 ── */}
      {bottomTab === "status" && (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
          {!summary ? <HeaderSkeleton /> : (
            <DashboardHeader
              terminal={terminal}
              currentForeignWaiting={summary.currentForeignWaiting}
              currentTotalWaiting={summary.currentTotalWaiting}
              arrivalCongestion={summary.arrivalCongestion}
              peakSlot={summary.peakSlot ? deserializeSlot(summary.peakSlot) : null}
              now={summary.nowISO}
              tomorrowLabel={summary.tomorrowLabel}
            />
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
              <button
                onClick={() => setActiveTab("passenger")}
                className={`text-xl font-bold transition-colors ${activeTab === "passenger" ? "text-gray-800" : "text-gray-300 hover:text-gray-400"}`}
              >
                승객 예고
              </button>
              <span className="text-gray-200 font-bold">·</span>
              <button
                onClick={() => setActiveTab("weekly")}
                className={`text-xl font-bold transition-colors ${activeTab === "weekly" ? "text-gray-800" : "text-gray-300 hover:text-gray-400"}`}
              >
                주간 예측
              </button>
            </div>
            <div className="relative h-80">
              <div className={`absolute inset-0 ${activeTab === "passenger" ? "" : "invisible pointer-events-none"}`}>
                {!summary ? <PassengerSkeleton /> : <PassengerChart slots={summary.slots.map(deserializeSlot)} tomorrowLabel={summary.tomorrowLabel} />}
              </div>
              <div className={`absolute inset-0 ${activeTab === "weekly" ? "" : "invisible pointer-events-none"}`}>
                {!flights ? <WeeklySkeleton /> : <WeeklyForecast days={flights.weeklyDays} />}
              </div>
            </div>
          </div>
          {(taxiT1 || taxiT2) && (
            <div>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="inline-block w-1 h-4 rounded-full bg-[#1B5E36]" />
                <h2 className="text-xl font-bold text-gray-800">택시 승강장</h2>
              </div>
              <TaxiStatusCard t1={taxiT1} t2={taxiT2} />
            </div>
          )}
        </div>
      )}

      {/* ── 운항편 탭 ── */}
      {bottomTab === "flights" && (
        <div className="max-w-lg mx-auto px-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" }}>
          {!flights ? (
            <FlightsSkeleton />
          ) : (
            <div>
              <FlightListSlider
                key={terminal}
                terminal={terminal}
                slots={flights.allSlots.map(deserializeSlot)}
                slotsLanding={flights.allSlotsLanding.map(deserializeSlot)}
                todayStr={flights.todayStr}
                tomorrowStr={flights.tomorrowStr}
                kstHour={flights.kstHour}
                congestion={summary?.arrivalCongestion}
              />
            </div>
          )}
        </div>
      )}

      {/* ── 하단 네비게이션 ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex">
          {(["flights", "status"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setBottomTab(key)}
              className="flex-1 flex flex-col items-center py-2 transition-colors"
            >
              <div className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl transition-colors ${
                bottomTab === key ? "bg-[#1B5E36]/10 text-[#1B5E36]" : "text-gray-400"
              }`}>
                {key === "status" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L8 8 .8 6.2l-.4-.4-.4.4.4.4L3 11l-2 1v2l2-1 .2.8.8.2-1 2h2l1-2 .2.8.8.2v2l2-1 .4.4.4-.4-.4-.4" />
                  </svg>
                )}
                <span className="text-xs font-medium">{key === "status" ? "입국 현황" : "운항편"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
