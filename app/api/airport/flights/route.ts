import { NextRequest } from "next/server";

import {
  fetchFlightStatus,
  fetchPassengerForecast,
  fetchWeeklyFlights,
} from "@/lib/airport/api-client";
import {
  buildWeeklyDays,
  buildWindowSlots,
  flightsFromStatus,
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
  const kstHour = new Date(now.getTime() + 9 * 3600_000).getUTCHours();

  const [
    [flightsToday, flightsTomorrow],
    [forecastsToday, forecastsTomorrow],
    weeklyItems,
  ] = await Promise.all([
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

  const allSlots = buildWindowSlots(forecasts, terminal, allStatusFlights, "exit", 6, 24, todayStr, tomorrowStr);
  const serializeSlots = (ss: typeof allSlots) =>
    ss.map((s) => ({ ...s, flights: s.flights.map(serializeFlight) }));

  return Response.json({
    allSlots: serializeSlots(allSlots),
    weeklyDays: buildWeeklyDays(weeklyItems, terminal),
    todayStr,
    tomorrowStr,
    kstHour,
  });
}
