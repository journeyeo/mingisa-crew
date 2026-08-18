import type {
  ArrivalCongestionItem,
  FlightStatusItem,
  PassengerForecastItem,
  ParkingItem,
  Terminal,
  WeeklyFlightItem,
} from "./types";
import {
  MOCK_ARRIVALS_T1,
  MOCK_ARRIVALS_T2,
  MOCK_FLIGHTS_T1,
  MOCK_FLIGHTS_T2,
  MOCK_PARKING,
  MOCK_PASSENGERS,
  MOCK_WEEKLY,
} from "./mock-data";

const BASE_URL = "https://apis.data.go.kr/B551177";
const SERVICE_KEY = process.env.AIRPORT_API_SERVICE_KEY;

function useMock() {
  return !SERVICE_KEY;
}

async function govFetch<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gov API error: ${res.status} — ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const items = json?.response?.body?.items;
  if (!items) return [];
  // 신형 API: items가 배열 / 구형 API: items.item
  if (Array.isArray(items)) return items as T[];
  const item = (items as Record<string, unknown>).item;
  if (!item) return [];
  return Array.isArray(item) ? (item as T[]) : [item as T];
}

/** 입국장현황 — H-2~H+2 시간 범위, 편명/대기인원 포함 */
export async function fetchArrivalsCongestion(
  terminal: Terminal
): Promise<ArrivalCongestionItem[]> {
  const fallback = terminal === "T1" ? MOCK_ARRIVALS_T1 : MOCK_ARRIVALS_T2;
  if (useMock()) return fallback;

  const url =
    `${BASE_URL}/StatusOfArrivals/getArrivalsCongestion` +
    `?serviceKey=${SERVICE_KEY}&type=json&numOfRows=100&terno=${terminal}`;
  return govFetch<ArrivalCongestionItem>(url).catch(() => fallback);
}

/** 여객편 운항현황 — 당일 실시간, 출구번호 포함 */
export async function fetchFlightStatus(
  terminal: Terminal,
  date: string // YYYYMMDD
): Promise<FlightStatusItem[]> {
  const fallback = terminal === "T1" ? MOCK_FLIGHTS_T1 : MOCK_FLIGHTS_T2;
  if (useMock()) return fallback;

  const t = terminal === "T1" ? "P" : "S";
  const url =
    `${BASE_URL}/StatusOfPassengerFlightsOdp/getPassengerArrivalsOdp` +
    `?serviceKey=${SERVICE_KEY}&type=json&numOfRows=500&schDate=${date}&terminal=${t}`;
  return govFetch<FlightStatusItem>(url).catch(() => fallback);
}

/** 주간 운항현황 — D+0~D+6, 시간대 예측용 */
export async function fetchWeeklyFlights(terminal: Terminal): Promise<WeeklyFlightItem[]> {
  const prefix = terminal === "T1" ? "P" : "S";
  const fallback = MOCK_WEEKLY.filter((f) => f.terminalid.startsWith(prefix));
  if (useMock()) return fallback;

  const pt = terminal === "T1" ? "P" : "S";
  const url =
    `${BASE_URL}/StatusOfPassengerFlightsDSOdp/getPassengerArrivalsDSOdp` +
    `?serviceKey=${SERVICE_KEY}&type=json&numOfRows=1000&terminal=${pt}`;
  return govFetch<WeeklyFlightItem>(url).catch(() => fallback);
}

/** 주차 현황 — T1/T2 구역별 주차 대수 */
export async function fetchParking(): Promise<ParkingItem[]> {
  if (useMock()) return MOCK_PARKING;

  const url = `${BASE_URL}/StatusOfParking/getTrackingParking?serviceKey=${SERVICE_KEY}&type=json&numOfRows=100`;
  return govFetch<ParkingItem>(url).catch(() => MOCK_PARKING);
}

/** 승객예고 — 시간대별 예상 승객 수 (갱신 주기 5분) */
export async function fetchPassengerForecast(
  date: string // YYYYMMDD
): Promise<PassengerForecastItem[]> {
  if (useMock()) return MOCK_PASSENGERS;

  const url =
    `${BASE_URL}/passgrAnncmt/getPassgrAnncmt` +
    `?serviceKey=${SERVICE_KEY}&type=json&numOfRows=100&schDate=${date}`;
  return govFetch<PassengerForecastItem>(url).catch(() => MOCK_PASSENGERS);
}
