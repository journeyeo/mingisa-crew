import { NextRequest } from "next/server";

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
import type { Flight, Terminal } from "@/lib/airport/types";


function serializeFlight(f: Flight) {
  return {
    ...f,
    scheduledTime: f.scheduledTime.toISOString(),
    landingTime: f.landingTime.toISOString(),
    exitTime: f.exitTime.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const terminal = (req.nextUrl.searchParams.get("terminal") === "T2" ? "T2" : "T1") as Terminal;

  const now = new Date();
  const toKST = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replace(/-/g, "");
  const todayStr = toKST(now);
  const tomorrowStr = toKST(new Date(now.getTime() + 86_400_000));
  const tomorrowLabel = `${parseInt(tomorrowStr.slice(4, 6))}/${parseInt(tomorrowStr.slice(6, 8))}`;
  const kstHour = new Date(now.getTime() + 9 * 3600_000).getUTCHours();
  const windowStartHour = Math.max(0, kstHour - 1);
  const windowSize = Math.min(30 - windowStartHour, 24); // 익일 06시까지, 최대 24시간
  const nowIdx = kstHour - windowStartHour;

  const [
    arrivals,
    [flightsToday, flightsTomorrow],
    [forecastsToday, forecastsTomorrow],
    weeklyItems,
    parkingItems,
  ] = await Promise.all([
    fetchArrivalsCongestion(terminal),
    Promise.all([
      fetchFlightStatus(terminal, todayStr),
      fetchFlightStatus(terminal, tomorrowStr).catch(() => []),
    ]),
    Promise.all([
      fetchPassengerForecast(todayStr),
      fetchPassengerForecast(tomorrowStr).catch(() => []),
    ]),
    fetchWeeklyFlights(terminal),
    fetchParking(),
  ]);

  const forecasts = [
    ...forecastsToday.map((f) => ({ ...f, adate: todayStr })),
    ...forecastsTomorrow.map((f) => ({ ...f, adate: tomorrowStr })),
  ];

  const mergedFlights = mergeFlightData(arrivals, [...flightsToday, ...flightsTomorrow], terminal);

  const flightDateKey = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const allStatusFlights = Array.from(
    new Map(
      [
        ...flightsFromStatus(flightsToday, todayStr, terminal),
        ...flightsFromStatus(flightsTomorrow, tomorrowStr, terminal),
      ].map((f) => [`${f.id}-${flightDateKey(f.scheduledTime)}`, f])
    ).values()
  );

  const slots = buildWindowSlots(forecasts, terminal, mergedFlights, "exit", windowStartHour, windowSize, todayStr, tomorrowStr);
  const allSlots = buildWindowSlots(forecasts, terminal, allStatusFlights, "exit", windowStartHour, windowSize, todayStr, tomorrowStr);

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

  const serializeSlots = (ss: typeof slots) =>
    ss.map((s) => ({ ...s, flights: s.flights.map(serializeFlight) }));

  const body = {
    slots: serializeSlots(slots),
    allSlots: serializeSlots(allSlots),
    peakSlot: peakSlot ? { ...peakSlot, flights: peakSlot.flights.map(serializeFlight) } : null,
    currentForeignWaiting,
    currentTotalWaiting,
    weeklyDays: buildWeeklyDays(weeklyItems, terminal),
    parking: summarizeParking(parkingItems, terminal),
    todayStr,
    tomorrowStr,
    tomorrowLabel,
    nowIdx,
    nowISO: now.toISOString(),
  };

  return Response.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
