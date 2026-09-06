import { unstable_cache } from "next/cache";

const SERVICE_KEY = process.env.AIRPORT_API_SERVICE_KEY;
const USE_MOCK = process.env.USE_MOCK === "true";
const BASE = "https://apis.data.go.kr/B551178/flight-status/detail";
const ROWS = 100;
const REVALIDATE = 300; // 5분

export interface GimpoFlight {
  flightId: string;
  airline: string;
  io: "I" | "O";
  line: "국내" | "국제";
  fromCity: string;
  toCity: string;
  std: string;
  etd: string | null;
  status: string | null;
  gate: string | null;
  baggage: string | null;
  date: string;
}

export interface GimpoFlightsData {
  arrivals: GimpoFlight[];
  departures: GimpoFlight[];
  todayStr: string;
  tomorrowStr: string;
  updatedAt: string;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function parseItem(i: Record<string, string | null>): GimpoFlight {
  return {
    flightId: (i.AIR_FLN ?? "") as string,
    airline: (i.AIRLINE_KOREAN ?? "") as string,
    io: (i.IO ?? "O") as "I" | "O",
    line: (i.LINE ?? "국내") as "국내" | "국제",
    fromCity: (i.BOARDING_KOR ?? "") as string,
    toCity: (i.ARRIVED_KOR ?? "") as string,
    std: (i.STD ?? "") as string,
    etd: i.ETD ?? null,
    status: i.RMK_KOR ?? null,
    gate: i.GATE ?? null,
    baggage: i.BAGGAGE_CLAIM ?? null,
    date: (i.FLIGHT_DATE ?? "") as string,
  };
}

async function fetchPage(page: number): Promise<GimpoFlight[]> {
  const url = `${BASE}?serviceKey=${SERVICE_KEY}&type=json&numOfRows=${ROWS}&pageNo=${page}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) return [];
  const arr: Record<string, string | null>[] = Array.isArray(items) ? items : [items];
  return arr.filter((i) => i.AIRPORT === "GMP").map(parseItem);
}

async function _fetchGimpoFlights(): Promise<GimpoFlightsData> {
  const kst = new Date(new Date().getTime() + 9 * 3600_000);
  const todayStr = toDateStr(kst);
  const tomorrowStr = toDateStr(new Date(kst.getTime() + 86_400_000));

  const firstUrl = `${BASE}?serviceKey=${SERVICE_KEY}&type=json&numOfRows=${ROWS}&pageNo=1`;
  const firstRes = await fetch(firstUrl, { cache: "no-store" });
  if (!firstRes.ok) throw new Error(`KAC API error: ${firstRes.status}`);
  const firstJson = await firstRes.json();
  const totalCount: number = firstJson?.response?.body?.totalCount ?? ROWS;
  const totalPages = Math.ceil(totalCount / ROWS);

  const firstItems = firstJson?.response?.body?.items?.item;
  const firstArr: Record<string, string | null>[] = Array.isArray(firstItems)
    ? firstItems : firstItems ? [firstItems] : [];
  const firstGmp = firstArr.filter((i) => i.AIRPORT === "GMP").map(parseItem);

  const restPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const restResults = await Promise.all(restPages.map(fetchPage));
  const all = [...firstGmp, ...restResults.flat()];

  const filtered = all.filter((f) => f.date === todayStr || f.date === tomorrowStr);

  const seen = new Set<string>();
  const deduped = filtered.filter((f) => {
    const key = `${f.date}_${f.io}_${f.flightId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const arrivals = deduped.filter((f) => f.io === "I").sort((a, b) => a.std.localeCompare(b.std));
  const departures = deduped.filter((f) => f.io === "O").sort((a, b) => a.std.localeCompare(b.std));

  return { arrivals, departures, todayStr, tomorrowStr, updatedAt: new Date().toISOString() };
}

function hhmm(base: Date, offsetMin = 0): string {
  const d = new Date(base.getTime() + offsetMin * 60_000);
  return `${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function mockGimpoData(): GimpoFlightsData {
  const kst = new Date(new Date().getTime() + 9 * 3600_000);
  const todayStr = toDateStr(kst);
  const tomorrowStr = toDateStr(new Date(kst.getTime() + 86_400_000));

  const domestic: GimpoFlight[] = [
    { flightId: "KE1201", airline: "대한항공",  io: "I", line: "국내", fromCity: "제주", toCity: "김포", std: hhmm(kst, -90), etd: null,            status: "도착", gate: null, baggage: "1", date: todayStr },
    { flightId: "OZ8901", airline: "아시아나",  io: "I", line: "국내", fromCity: "부산", toCity: "김포", std: hhmm(kst, -45), etd: null,            status: "도착", gate: null, baggage: "2", date: todayStr },
    { flightId: "7C101",  airline: "제주항공",  io: "I", line: "국내", fromCity: "제주", toCity: "김포", std: hhmm(kst, -10), etd: hhmm(kst, 5),   status: "지연", gate: null, baggage: null, date: todayStr },
    { flightId: "KE1205", airline: "대한항공",  io: "I", line: "국내", fromCity: "제주", toCity: "김포", std: hhmm(kst,  20), etd: null,            status: null,   gate: null, baggage: null, date: todayStr },
    { flightId: "LJ201",  airline: "진에어",    io: "I", line: "국내", fromCity: "대구", toCity: "김포", std: hhmm(kst,  50), etd: null,            status: null,   gate: null, baggage: null, date: todayStr },
    { flightId: "TW201",  airline: "티웨이",    io: "I", line: "국내", fromCity: "제주", toCity: "김포", std: hhmm(kst,  80), etd: null,            status: null,   gate: null, baggage: null, date: todayStr },
    { flightId: "BX301",  airline: "에어부산",  io: "I", line: "국내", fromCity: "부산", toCity: "김포", std: hhmm(kst, 110), etd: hhmm(kst, 125), status: "지연", gate: null, baggage: null, date: todayStr },
    { flightId: "OZ901",  airline: "아시아나",  io: "I", line: "국내", fromCity: "제주", toCity: "김포", std: hhmm(kst, 140), etd: null,            status: null,   gate: null, baggage: null, date: todayStr },
  ];

  const international: GimpoFlight[] = [
    { flightId: "KE705",  airline: "대한항공",    io: "I", line: "국제", fromCity: "도쿄(HND)", toCity: "김포", std: hhmm(kst, -60), etd: null,            status: "도착", gate: null, baggage: "3", date: todayStr },
    { flightId: "NH852",  airline: "ANA",         io: "I", line: "국제", fromCity: "도쿄(HND)", toCity: "김포", std: hhmm(kst,  15), etd: null,            status: null,   gate: null, baggage: null, date: todayStr },
    { flightId: "OZ102",  airline: "아시아나",    io: "I", line: "국제", fromCity: "베이징(PEK)", toCity: "김포", std: hhmm(kst, 70), etd: hhmm(kst, 90), status: "지연", gate: null, baggage: null, date: todayStr },
    { flightId: "KE707",  airline: "대한항공",    io: "I", line: "국제", fromCity: "오사카(ITM)", toCity: "김포", std: hhmm(kst, 120), etd: null,          status: null,   gate: null, baggage: null, date: todayStr },
  ];

  return {
    arrivals: [...domestic, ...international].sort((a, b) => a.std.localeCompare(b.std)),
    departures: [],
    todayStr,
    tomorrowStr,
    updatedAt: new Date().toISOString(),
  };
}

const _cached = unstable_cache(_fetchGimpoFlights, ["gimpo-flights"], { revalidate: REVALIDATE });

let _lastGood: GimpoFlightsData | null = null;

export async function getCachedGimpoFlights(): Promise<GimpoFlightsData> {
  if (process.env.MOCK_FLIGHT_ERROR === "true") throw new Error("mock flight error");
  if (USE_MOCK) return mockGimpoData();
  try {
    const data = await _cached();
    if (data.arrivals.length > 0 || data.departures.length > 0) {
      _lastGood = data;
    }
    return data;
  } catch (e) {
    if (_lastGood) return _lastGood;
    throw e;
  }
}
