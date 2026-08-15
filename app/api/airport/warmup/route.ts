import {
  fetchArrivalsCongestion,
  fetchFlightStatus,
  fetchParking,
  fetchPassengerForecast,
  fetchWeeklyFlights,
} from "@/lib/airport/api-client";

export async function GET() {
  const now = new Date();
  const toKST = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })
      .format(d)
      .replace(/-/g, "");
  const today = toKST(now);
  const tomorrow = toKST(new Date(now.getTime() + 86_400_000));

  await Promise.all([
    fetchArrivalsCongestion("T1"),
    fetchArrivalsCongestion("T2"),
    fetchFlightStatus("T1", today),
    fetchFlightStatus("T1", tomorrow),
    fetchFlightStatus("T2", today),
    fetchFlightStatus("T2", tomorrow),
    fetchPassengerForecast(today),
    fetchPassengerForecast(tomorrow),
    fetchWeeklyFlights("T1"),
    fetchWeeklyFlights("T2"),
    fetchParking(),
  ]);

  return Response.json({ ok: true, refreshed: now.toISOString() });
}
