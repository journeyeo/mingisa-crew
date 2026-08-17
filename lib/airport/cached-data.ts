import { unstable_cache } from "next/cache";

import {
  fetchArrivalsCongestion,
  fetchFlightStatus,
  fetchPassengerForecast,
  fetchWeeklyFlights,
} from "./api-client";
import {
  buildWeeklyDays,
  buildWindowSlots,
  findPeakSlot,
  flightsFromStatus,
} from "./transform";
import { FLIGHT_MINUTES } from "./flight-minutes";
import { estimateMissing } from "./estimate-minutes";
import type { Flight, Terminal } from "./types";

// ─── Serialization helpers ────────────────────────────────────────────────────

function serializeFlight(f: Flight) {
  return {
    ...f,
    scheduledTime: f.scheduledTime.toISOString(),
    landingTime: f.landingTime.toISOString(),
    exitTime: f.exitTime.toISOString(),
  };
}

function serializeSlots<T extends { flights: Flight[] }>(slots: T[]) {
  return slots.map((s) => ({ ...s, flights: s.flights.map(serializeFlight) }));
}

// ─── Cached fetchers (shared across all function instances via Vercel Data Cache) ─

export const getCachedSummary = unstable_cache(
  async (terminal: Terminal, todayStr: string, tomorrowStr: string) => {
    const now = new Date();
    const tomorrowLabel = `${parseInt(tomorrowStr.slice(4, 6))}/${parseInt(tomorrowStr.slice(6, 8))}`;
    const kstHour = new Date(now.getTime() + 9 * 3600_000).getUTCHours();
    const windowStartHour = Math.max(0, kstHour - 1);
    const windowSize = Math.min(30 - windowStartHour, 24);

    const [arrivals, [forecastsToday, forecastsTomorrow]] = await Promise.all([
      fetchArrivalsCongestion(terminal),
      Promise.all([
        fetchPassengerForecast(todayStr),
        fetchPassengerForecast(tomorrowStr).catch(() => []),
      ]),
    ]);

    const forecasts = [
      ...forecastsToday.map((f) => ({ ...f, adate: todayStr })),
      ...forecastsTomorrow.map((f) => ({ ...f, adate: tomorrowStr })),
    ];

    const slots = buildWindowSlots(forecasts, terminal, [], "exit", windowStartHour, windowSize, todayStr, tomorrowStr);
    const futureSlots = slots.filter(
      (s) => s.date === tomorrowStr || (s.date === todayStr && s.hour > kstHour)
    );
    const peakSlot = findPeakSlot(futureSlots);

    const currentForeignWaiting = arrivals.reduce(
      (sum, a) => sum + (parseFloat(a.foreigner ?? "0") || 0), 0
    );
    const currentTotalWaiting = arrivals.reduce(
      (sum, a) => sum + ((parseFloat(a.foreigner ?? "0") + parseFloat(a.korean ?? "0")) || 0), 0
    );

    return {
      slots: serializeSlots(slots),
      peakSlot: peakSlot ? { ...peakSlot, flights: peakSlot.flights.map(serializeFlight) } : null,
      currentForeignWaiting,
      currentTotalWaiting,
      todayStr,
      tomorrowStr,
      tomorrowLabel,
      kstHour,
      nowISO: now.toISOString(),
    };
  },
  ["airport-summary"],
  { revalidate: 300 }
);

export const getCachedFlights = unstable_cache(
  async (terminal: Terminal, todayStr: string, tomorrowStr: string) => {
    const kstHour = new Date(new Date().getTime() + 9 * 3600_000).getUTCHours();

    const [[flightsToday, flightsTomorrow], [forecastsToday, forecastsTomorrow], weeklyItems] =
      await Promise.all([
        Promise.all([
          fetchFlightStatus(terminal, todayStr),
          fetchFlightStatus(terminal, tomorrowStr).catch(() => []),
        ]),
        Promise.all([
          fetchPassengerForecast(todayStr),
          fetchPassengerForecast(tomorrowStr).catch(() => []),
        ]),
        fetchWeeklyFlights(terminal),
      ]);

    const forecasts = [
      ...forecastsToday.map((f) => ({ ...f, adate: todayStr })),
      ...forecastsTomorrow.map((f) => ({ ...f, adate: tomorrowStr })),
    ];

    const flightDateKey = (d: Date) => {
      const k = new Date(d.getTime() + 9 * 3600_000);
      return `${k.getUTCFullYear()}${String(k.getUTCMonth() + 1).padStart(2, "0")}${String(k.getUTCDate()).padStart(2, "0")}`;
    };
    const allStatusFlights = Array.from(
      new Map(
        [
          ...flightsFromStatus(flightsToday, todayStr, terminal),
          ...flightsFromStatus(flightsTomorrow, tomorrowStr, terminal),
        ].map((f) => [`${f.id}-${flightDateKey(f.scheduledTime)}`, f])
      ).values()
    );

    const allSlots = buildWindowSlots(forecasts, terminal, allStatusFlights, "exit", 0, 30, todayStr, tomorrowStr);
    const allSlotsLanding = buildWindowSlots(forecasts, terminal, allStatusFlights, "landing", 0, 30, todayStr, tomorrowStr);

    // 정적 테이블에 없는 공항 코드를 좌표 기반으로 추정 (비동기 영향 없음 — 순수 계산)
    const allCodes = [...new Set(allStatusFlights.map((f) => f.airportCode).filter(Boolean))] as string[];
    const extraMinutes = estimateMissing(allCodes, FLIGHT_MINUTES);

    return {
      allSlots: serializeSlots(allSlots),
      allSlotsLanding: serializeSlots(allSlotsLanding),
      extraMinutes,
      todayStr,
      tomorrowStr,
      kstHour,
    };
  },
  ["airport-flights-v3"],
  { revalidate: 300 }
);
