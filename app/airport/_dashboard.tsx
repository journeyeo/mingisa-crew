import { Suspense } from "react";
import type { Terminal } from "@/lib/airport/types";
import {
  fetchArrivalsCongestion,
  fetchFlightStatus,
  fetchParking,
  fetchPassengerForecast,
  fetchWeeklyFlights,
} from "@/lib/airport/api-client";
import {
  buildWeeklyDays,
  buildWindowSlots,
  findPeakSlot,
  flightsFromStatus,
  mergeFlightData,
  summarizeParking,
} from "@/lib/airport/transform";

import { DashboardHeader } from "@/components/airport/DashboardHeader";
import { TerminalToggle } from "@/components/airport/TerminalBasisToggle";
import { PassengerChart } from "@/components/airport/PassengerChart";
import { FlightListSlider } from "@/components/airport/FlightListSlider";
import { ParkingStatus } from "@/components/airport/ParkingStatus";
import { WeeklyForecast } from "@/components/airport/WeeklyForecast";
import { Footer } from "@/components/Footer";

interface Props {
  terminal: Terminal;
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function Sk({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

function MainContentSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-2">
            <Sk className="h-3 w-10" />
            <Sk className="h-8 w-14" />
            <Sk className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
        <div className="flex gap-5 mb-4">
          {[0, 1, 2].map((i) => <Sk key={i} className="h-3 w-14" />)}
        </div>
        <div className="h-52 flex items-end gap-1">
          {[35, 55, 70, 45, 80, 60, 30, 50, 65, 40, 25, 45].map((h, i) => (
            <div key={i} className="flex-1 animate-pulse bg-gray-100 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {[0, 1, 2, 3].map((i) => <Sk key={i} className="h-3 w-8" />)}
        </div>
      </div>
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
    </>
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

function ParkingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-2">
      <Sk className="h-3 w-16" />
      <Sk className="h-6 w-12" />
      <Sk className="h-2 w-full rounded-full" />
    </div>
  );
}

// ─── Async section components ────────────────────────────────────────────────

async function MainContent({
  terminal,
  todayStr,
  tomorrowStr,
  nowISO,
  kstHour,
  tomorrowLabel,
}: {
  terminal: Terminal;
  todayStr: string;
  tomorrowStr: string;
  nowISO: string;
  kstHour: number;
  tomorrowLabel: string;
}) {
  const nowHour = kstHour;
  const windowStartHour = Math.max(0, nowHour - 1);
  const nowIdx = nowHour - windowStartHour;
  const windowSize = 13; // 1시간 전 + 현재 + 11시간 후 = 총 12시간 앞

  const [arrivals, [flightsToday, flightsTomorrow], [forecastsToday, forecastsTomorrow]] =
    await Promise.all([
      fetchArrivalsCongestion(terminal),
      Promise.all([
        fetchFlightStatus(terminal, todayStr),
        fetchFlightStatus(terminal, tomorrowStr).catch(() => []),
      ]),
      Promise.all([
        fetchPassengerForecast(todayStr),
        fetchPassengerForecast(tomorrowStr).catch(() => []),
      ]),
    ]);

  const flights = [...flightsToday, ...flightsTomorrow];
  const forecasts = [
    ...forecastsToday.map((f) => ({ ...f, adate: todayStr })),
    ...forecastsTomorrow.map((f) => ({ ...f, adate: tomorrowStr })),
  ];

  const mergedFlights = mergeFlightData(arrivals, flights, terminal);
  const allStatusFlightsRaw = [
    ...flightsFromStatus(flightsToday, todayStr, terminal),
    ...flightsFromStatus(flightsTomorrow, tomorrowStr, terminal),
  ];
  // flightId 만으로 중복 제거하면 동일 편이 오늘·내일 각각 있을 때 내일 버전이 오늘 슬롯을 덮어씀
  // → scheduledTime 날짜까지 포함한 복합키로 날짜별 독립 항목 유지
  const flightDateKey = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const allStatusFlights = Array.from(
    new Map(allStatusFlightsRaw.map((f) => [`${f.id}-${flightDateKey(f.scheduledTime)}`, f])).values()
  );

  const slots = buildWindowSlots(forecasts, terminal, mergedFlights, "exit", windowStartHour, 12, todayStr, tomorrowStr);
  const allSlots = buildWindowSlots(forecasts, terminal, allStatusFlights, "exit", windowStartHour, windowSize, todayStr, tomorrowStr);

  const futureSlots = slots.filter((s) =>
    s.date === tomorrowStr || (s.date === todayStr && s.hour > nowHour)
  );
  const peakSlot = findPeakSlot(futureSlots);

  const currentForeignWaiting = arrivals.reduce(
    (sum, a) => sum + (parseFloat(a.foreigner ?? "0") || 0), 0
  );
  const currentTotalWaiting = arrivals.reduce(
    (sum, a) => sum + ((parseFloat(a.foreigner ?? "0") + parseFloat(a.korean ?? "0")) || 0), 0
  );

  return (
    <>
      <DashboardHeader
        terminal={terminal}
        currentForeignWaiting={currentForeignWaiting}
        currentTotalWaiting={currentTotalWaiting}
        peakSlot={peakSlot}
        now={nowISO}
        tomorrowLabel={tomorrowLabel}
      />
      <PassengerChart slots={slots} tomorrowLabel={tomorrowLabel} />
      <div>
        <p className="text-sm font-semibold text-gray-400 mb-3">
          시간대별 운항편 <span className="text-gray-300">({terminal})</span>
        </p>
        <FlightListSlider slots={allSlots} todayStr={todayStr} tomorrowStr={tomorrowStr} nowIdx={nowIdx} />
      </div>
    </>
  );
}

async function AsyncWeeklyForecast({ terminal }: { terminal: Terminal }) {
  const weeklyItems = await fetchWeeklyFlights(terminal);
  const weeklyDays = buildWeeklyDays(weeklyItems);
  return (
    <div>
      <p className="text-sm font-semibold text-gray-400 mb-3">주간 예측</p>
      <WeeklyForecast days={weeklyDays} />
    </div>
  );
}

async function AsyncParkingStatus({ terminal }: { terminal: Terminal }) {
  const parkingItems = await fetchParking();
  const parking = summarizeParking(parkingItems, terminal);
  return <ParkingStatus parking={parking} />;
}

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AirportDashboard({ terminal }: Props) {
  const now = new Date();
  // 인천공항 API는 KST(UTC+9) 기준 날짜를 사용하므로 항상 KST로 계산
  const toKSTDateStr = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replace(/-/g, "");
  const todayStr = toKSTDateStr(now);
  const tomorrowStr = toKSTDateStr(new Date(now.getTime() + 86_400_000));
  const tomorrowLabel = `${parseInt(tomorrowStr.slice(4, 6))}/${parseInt(tomorrowStr.slice(6, 8))}`;
  const nowISO = now.toISOString();
  // epoch 기반 KST 시간 — 서버 타임존과 무관하게 항상 정확
  const kstHour = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCHours();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">인천공항 입국 수요</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
              {" · 5분 갱신"}
            </p>
          </div>
          <Suspense>
            <TerminalToggle terminal={terminal} />
          </Suspense>
        </div>

        <Suspense fallback={<MainContentSkeleton />}>
          <MainContent
            terminal={terminal}
            todayStr={todayStr}
            tomorrowStr={tomorrowStr}
            nowISO={nowISO}
            kstHour={kstHour}
            tomorrowLabel={tomorrowLabel}
          />
        </Suspense>

        <Suspense fallback={<WeeklySkeleton />}>
          <AsyncWeeklyForecast terminal={terminal} />
        </Suspense>

        <Suspense fallback={<ParkingSkeleton />}>
          <AsyncParkingStatus terminal={terminal} />
        </Suspense>

        <p className="text-xs text-gray-300 pb-2">출처: 인천국제공항공사 공공데이터포털</p>
      </div>
      <Footer />
    </main>
  );
}
