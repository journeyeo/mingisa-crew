import { NextRequest } from "next/server";

import { fetchArrivalsCongestion, fetchPassengerForecast } from "@/lib/airport/api-client";
import { buildWindowSlots, findPeakSlot } from "@/lib/airport/transform";
import type { Terminal } from "@/lib/airport/types";

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

  // 승객 예고 슬롯 (항공편 없이 — PassengerChart는 승객 수만 사용)
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

  return Response.json({
    slots,
    peakSlot,
    currentForeignWaiting,
    currentTotalWaiting,
    todayStr,
    tomorrowStr,
    tomorrowLabel,
    kstHour,
    nowISO: now.toISOString(),
  });
}
