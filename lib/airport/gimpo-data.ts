import { unstable_cache } from "next/cache";

const SERVICE_KEY = process.env.AIRPORT_API_SERVICE_KEY;
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
  const res = await fetch(url, { next: { revalidate: REVALIDATE } });
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
  const firstRes = await fetch(firstUrl, { next: { revalidate: REVALIDATE } });
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

  if (arrivals.length === 0 && departures.length === 0) throw new Error("No GMP flights found");

  return { arrivals, departures, todayStr, tomorrowStr, updatedAt: new Date().toISOString() };
}

export function getCachedGimpoFlights() {
  return unstable_cache(_fetchGimpoFlights, ["gimpo-flights"], { revalidate: REVALIDATE })();
}
