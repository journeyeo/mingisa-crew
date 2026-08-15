import type {
  ArrivalCongestionItem,
  DailyHourlySlot,
  Flight,
  FlightStatusItem,
  HourlySlot,
  ParkingItem,
  ParkingSummary,
  PassengerForecastItem,
  Terminal,
  WeeklyDay,
  WeeklyFlightItem,
} from "./types";
import {
  CHART_HOURS,
  EXIT_DELAY,
  isNoTransport,
} from "./constants";

function parseDateTime(raw: string): Date {
  const clean = raw.trim();
  if (clean.includes("-") || clean.includes(" ")) {
    return new Date(clean.replace(" ", "T") + ":00");
  }
  // "202608112040" — YYYYMMDDHHMM (12자, 공백 없음)
  if (clean.length >= 12) {
    const y = clean.slice(0, 4), mo = clean.slice(4, 6), d = clean.slice(6, 8);
    const h = clean.slice(8, 10), mi = clean.slice(10, 12);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
  }
  return new Date(NaN);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** 착륙 시각 → 출구 도착 예상 시각 (외국인 기준 평균) */
export function toExitTime(landingTime: Date): Date {
  return addMinutes(landingTime, EXIT_DELAY.average);
}

/** 입국장현황 + 여객편 운항현황 → 통합 Flight 목록 */
export function mergeFlightData(
  arrivals: ArrivalCongestionItem[],
  flights: FlightStatusItem[],
  terminal: Terminal
): Flight[] {
  const flightMap = new Map(flights.map((f) => [f.flightId.toUpperCase(), f]));

  return arrivals.map((a) => {
    const f = flightMap.get(a.flightid.toUpperCase());
    const schedTime = parseDateTime(a.scheduletime);
    const actualTime = a.estimatedtime
      ? parseDateTime(a.estimatedtime)
      : schedTime;
    const isDelayed =
      Math.abs(actualTime.getTime() - schedTime.getTime()) > 10 * 60_000;

    return {
      id: a.flightid,
      airline: f?.airline ?? a.airport,
      origin: a.airport,
      terminal,
      scheduledTime: schedTime,
      landingTime: actualTime,
      exitTime: toExitTime(actualTime),
      exitGate: f?.exitnumber ?? "",
      isDelayed,
      foreignWaiting: parseFloat(a.foreigner ?? "0") || 0,
      totalWaiting: (parseFloat(a.foreigner ?? "0") + parseFloat(a.korean ?? "0")) || 0,
    };
  });
}

/** 승객예고 데이터를 시간대별 슬롯으로 변환 */
const ALL_24_HOURS = Array.from({ length: 24 }, (_, i) => i);

export function buildHourlySlots(
  forecasts: PassengerForecastItem[],
  terminal: Terminal,
  flights: Flight[],
  basis: "exit" | "landing",
  hours: number[] = CHART_HOURS
): HourlySlot[] {
  // forecast를 시간 단위로 집계 (30분 단위 데이터를 합산)
  const forecastByHour = new Map<number, { foreign: number; domestic: number }>();
  for (const f of forecasts) {
    // atime: "00_01" → 시작 시간이 hour
    const hour = parseInt(f.atime.slice(0, 2), 10);
    // t1egsum1: T1 입국장 합계, t2egsum1: T2 입국장 합계
    const total =
      terminal === "T1"
        ? parseFloat(f.t1egsum1 ?? "0")
        : parseFloat(f.t2egsum1 ?? "0");
    // 외국인/내국인 비율 70/30 추정 (실측 데이터로 보정 가능)
    const foreign = Math.round(total * 0.7);
    const domestic = total - foreign;
    const prev = forecastByHour.get(hour) ?? { foreign: 0, domestic: 0 };
    forecastByHour.set(hour, {
      foreign: prev.foreign + foreign,
      domestic: prev.domestic + domestic,
    });
  }

  return hours.map((hour) => {
    const counts = forecastByHour.get(hour) ?? { foreign: 0, domestic: 0 };
    const slotFlights = flights.filter((flight) => {
      const t = basis === "exit" ? flight.exitTime : flight.landingTime;
      return t.getHours() === hour;
    });

    const noTransport = isNoTransport(
      hour === 0 ? 24 : hour, // 0시 = 자정 = 24:00 로 처리
      0
    );

    return {
      hour,
      foreignCount: counts.foreign,
      domesticCount: counts.domestic,
      flightCount: slotFlights.length,
      isNoTransport: noTransport,
      flights: slotFlights,
    };
  });
}

/** 날짜 경계를 고려한 창(window) 기반 슬롯 생성 — 슬라이더용 */
export function buildWindowSlots(
  forecasts: PassengerForecastItem[],
  terminal: Terminal,
  flights: Flight[],
  basis: "exit" | "landing",
  windowStartHour: number, // 0~23
  windowSize: number,
  todayStr: string,
  tomorrowStr: string
): HourlySlot[] {
  // 창 내 (date, hour) 목록 생성
  const entries: Array<{ date: string; hour: number }> = [];
  let h = windowStartHour, d = todayStr;
  for (let i = 0; i < windowSize; i++) {
    entries.push({ date: d, hour: h });
    const next = (h + 1) % 24;
    if (next === 0 && d === todayStr) d = tomorrowStr;
    h = next;
  }

  // 승객예고: (YYYYMMDD-hour) 키로 집계
  const forecastByKey = new Map<string, { foreign: number; domestic: number }>();
  for (const f of forecasts) {
    const hour = parseInt(f.atime.slice(0, 2), 10);
    const key = `${f.adate}-${hour}`;
    const total = terminal === "T1" ? parseFloat(f.t1egsum1 ?? "0") : parseFloat(f.t2egsum1 ?? "0");
    const foreign = Math.round(total * 0.7);
    const prev = forecastByKey.get(key) ?? { foreign: 0, domestic: 0 };
    forecastByKey.set(key, { foreign: prev.foreign + foreign, domestic: prev.domestic + (total - foreign) });
  }

  // 항공편: (YYYYMMDD-hour) 키로 집계
  const flightsByKey = new Map<string, Flight[]>();
  for (const flight of flights) {
    const t = basis === "exit" ? flight.exitTime : flight.landingTime;
    const fd = `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,"0")}${String(t.getDate()).padStart(2,"0")}`;
    const key = `${fd}-${t.getHours()}`;
    if (!flightsByKey.has(key)) flightsByKey.set(key, []);
    flightsByKey.get(key)!.push(flight);
  }

  return entries.map(({ date, hour }) => {
    const key = `${date}-${hour}`;
    const counts = forecastByKey.get(key) ?? { foreign: 0, domestic: 0 };
    const slotFlights = flightsByKey.get(key) ?? [];
    return {
      hour, date,
      foreignCount: counts.foreign,
      domesticCount: counts.domestic,
      flightCount: slotFlights.length,
      isNoTransport: isNoTransport(hour === 0 ? 24 : hour, 0),
      flights: slotFlights,
    };
  });
}

/** FlightStatusItem[] → Flight[] (슬라이더용 전일정 변환, 대기인원 없음) */
export function flightsFromStatus(
  items: FlightStatusItem[],
  dateStr: string, // YYYYMMDD
  terminal: Terminal
): Flight[] {
  // API terminalId 매핑: P01/P02 = T1 메인, P03 = T2(제2터미널)/탑승동
  // S01은 개발계정에서 미제공 — 운영계정 전환 시 재검토 필요
  const filtered = terminal === "T1"
    ? items.filter((f) => f.terminalId === "P01" || f.terminalId === "P02")
    : items.filter((f) => f.terminalId === "P03");
  const y = dateStr.slice(0, 4), mo = dateStr.slice(4, 6), d = dateStr.slice(6, 8);
  return filtered.map((f) => {
    const hh = (f.scheduleDateTime ?? "0000").slice(0, 2);
    const mm = (f.scheduleDateTime ?? "0000").slice(2, 4);
    const schedTime = new Date(`${y}-${mo}-${d}T${hh}:${mm}:00`);
    const ehh = (f.estimatedDateTime ?? "").slice(0, 2);
    const emm = (f.estimatedDateTime ?? "").slice(2, 4);
    let actualTime = f.estimatedDateTime
      ? new Date(`${y}-${mo}-${d}T${ehh}:${emm}:00`)
      : schedTime;
    // 자정 경계 보정: ±12시간 초과 차이는 하루 오차로 판단
    const rawDiff = actualTime.getTime() - schedTime.getTime();
    if (rawDiff < -12 * 3600_000) actualTime = new Date(actualTime.getTime() + 86_400_000);
    else if (rawDiff > 12 * 3600_000) actualTime = new Date(actualTime.getTime() - 86_400_000);
    const isDelayed = Math.abs(actualTime.getTime() - schedTime.getTime()) > 10 * 60_000;
    return {
      id: f.flightId,
      airline: f.airline,
      origin: f.airport,
      terminal,
      scheduledTime: schedTime,
      landingTime: actualTime,
      exitTime: toExitTime(actualTime),
      exitGate: f.exitnumber ?? "",
      isDelayed,
      foreignWaiting: 0,
      totalWaiting: 0,
    };
  });
}

/** 오늘의 피크 시간대 찾기 */
export function findPeakSlot(slots: HourlySlot[]): HourlySlot | null {
  return slots.reduce<HourlySlot | null>((peak, slot) => {
    if (!peak) return slot;
    const total = slot.foreignCount + slot.domesticCount;
    const peakTotal = peak.foreignCount + peak.domesticCount;
    return total > peakTotal ? slot : peak;
  }, null);
}

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 주간 운항 데이터 → WeeklyDay[] (D+0~D+6) */
export function buildWeeklyDays(items: WeeklyFlightItem[], terminal: Terminal): WeeklyDay[] {
  const filtered = terminal === "T1"
    ? items.filter((f) => f.terminalid === "P01" || f.terminalid === "P02")
    : items.filter((f) => f.terminalid === "P03");
  items = filtered;
  return Array.from({ length: 7 }, (_, offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    const date = `${y}${mo}${dy}`;

    const dayFlights = items.filter((f) => f.scheduleDateTime.startsWith(date));

    // 시간대별 집계 — scheduleDateTime: "202608102355" (8자 날짜 + 4자 시간)
    const countByHour = new Map<number, number>();
    for (const f of dayFlights) {
      const hStr = f.scheduleDateTime.slice(8, 10);
      const hour = parseInt(hStr, 10);
      countByHour.set(hour, (countByHour.get(hour) ?? 0) + 1);
    }

    const ALL_HOURS = Array.from({ length: 24 }, (_, h) => h);
    const slots: DailyHourlySlot[] = ALL_HOURS.map((hour) => ({
      hour,
      flightCount: countByHour.get(hour) ?? 0,
      isNoTransport: isNoTransport(hour, 0),
    }));

    const goldenHourFlights = slots
      .filter((s) => s.isNoTransport)
      .reduce((sum, s) => sum + s.flightCount, 0);

    const label = offset === 0 ? "오늘" : offset === 1 ? "내일" : DOW_KO[d.getDay()];

    return {
      date,
      label,
      dayOfWeek: DOW_KO[d.getDay()],
      slots,
      totalFlights: dayFlights.length,
      goldenHourFlights,
    };
  });
}

/** 주차 데이터 → 터미널별 요약 */
function toLot(items: ParkingItem[]): import("@/lib/airport/types").ParkingLot {
  const capacity = items.reduce((s, p) => s + parseInt(p.parkingarea, 10), 0);
  const occupied = items.reduce((s, p) => s + parseInt(p.parking, 10), 0);
  const rate = capacity > 0 ? occupied / capacity : 0;
  const level = rate >= 0.95 ? "만차" : rate >= 0.8 ? "혼잡" : rate >= 0.5 ? "보통" : "여유";
  return { capacity, occupied, rate, level };
}

export function summarizeParking(items: ParkingItem[], terminal: Terminal): ParkingSummary {
  // floor: "T1 단기주차장지하1층" / "T1 장기주차장지하1층"
  const filtered = items.filter((p) => p.floor.startsWith(terminal));
  const shortItems = filtered.filter((p) => p.floor.includes("단기"));
  const longItems  = filtered.filter((p) => p.floor.includes("장기"));

  const capacity = filtered.reduce((s, p) => s + parseInt(p.parkingarea, 10), 0);
  const occupied = filtered.reduce((s, p) => s + parseInt(p.parking, 10), 0);
  const rate = capacity > 0 ? occupied / capacity : 0;
  const level: ParkingSummary["level"] =
    rate >= 0.95 ? "만차" : rate >= 0.8 ? "혼잡" : rate >= 0.5 ? "보통" : "여유";

  return { terminal, capacity, occupied, rate, level, shortTerm: toLot(shortItems), longTerm: toLot(longItems) };
}

/** 시간 포맷 — "22:15" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 시간 레이블 — "23시" or "익일 01시" */
export function hourLabel(hour: number): string {
  if (hour < CHART_HOURS[0]) {
    return `익일 ${String(hour).padStart(2, "0")}시`;
  }
  return `${String(hour).padStart(2, "0")}시`;
}
