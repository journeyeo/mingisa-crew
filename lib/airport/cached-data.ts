import { unstable_cache } from "next/cache";

function withCache<T>(fn: () => Promise<T>, key: string[], opts: { revalidate: number }): Promise<T> {
  return unstable_cache(fn, key, opts)();
}

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

// ─── Cached fetchers ──────────────────────────────────────────────────────────
// terminal을 캐시 키에 명시적으로 포함 — unstable_cache가 인자를 자동으로 구분하지 못하는 이슈 우회

export function getCachedSummary(terminal: Terminal, todayStr: string, tomorrowStr: string) {
  return withCache(
    async () => {
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

      const terminalArrivals = arrivals.filter((a) => a.terno === terminal);
      const currentForeignWaiting = terminalArrivals.reduce(
        (sum, a) => sum + (parseFloat(a.foreigner ?? "0") || 0), 0
      );
      const currentTotalWaiting = terminalArrivals.reduce(
        (sum, a) => sum + ((parseFloat(a.foreigner ?? "0") + parseFloat(a.korean ?? "0")) || 0), 0
      );

      const arrivalCongestion = terminalArrivals.map((a) => ({
        flightid: a.flightid,
        entrygate: a.entrygate,
        airport: a.airport,
        gatenumber: a.gatenumber,
        korean: parseFloat(a.korean ?? "0") || 0,
        foreigner: parseFloat(a.foreigner ?? "0") || 0,
        scheduletime: a.scheduletime,
        estimatedtime: a.estimatedtime,
      }));

      return {
        slots: serializeSlots(slots),
        peakSlot: peakSlot ? { ...peakSlot, flights: peakSlot.flights.map(serializeFlight) } : null,
        currentForeignWaiting,
        currentTotalWaiting,
        arrivalCongestion,
        todayStr,
        tomorrowStr,
        tomorrowLabel,
        kstHour,
        nowISO: now.toISOString(),
      };
    },
    ["airport-summary", terminal, todayStr, tomorrowStr],
    { revalidate: 600 }
  );
}

export function getCachedFlights(terminal: Terminal, todayStr: string, tomorrowStr: string) {
  return withCache(
    async () => {
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

      return {
        allSlots: serializeSlots(allSlots),
        allSlotsLanding: serializeSlots(allSlotsLanding),
        weeklyDays: buildWeeklyDays(weeklyItems, terminal),
        todayStr,
        tomorrowStr,
        kstHour,
      };
    },
    ["airport-flights-v3", terminal, todayStr, tomorrowStr],
    { revalidate: 600 }
  );
}
