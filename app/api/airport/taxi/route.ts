import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";

export const preferredRegion = ["icn1"];

const BASE_URL = "https://apis.data.go.kr/B551177";
const SERVICE_KEY = process.env.AIRPORT_API_SERVICE_KEY;

export interface TaxiStatus {
  terno: string;
  seoultaxicnt: number;
  incheontaxicnt: number;
  gyenggitaxicnt: number;
  besttaxicnt: number;
  vantaxicnt: number;
  intercitytaxicnt: number;
  seoulstandtime: string;
  incheonstandtime: string;
  gyenggistandtime: string;
  beststandtime: string;
  vanstandtime: string;
  intercitystandtime: string;
  seoultaxistand: string;
  incheontaxistand: string;
  gyenggitaxistand: string;
  bestVantaxistand: string;
  intercitytaxistand: string;
  updatetime: string;
}

async function fetchTaxiStatus(terno: string): Promise<TaxiStatus | null> {
  if (!SERVICE_KEY) return null;
  const url = `${BASE_URL}/StatusOfTaxi/getTaxiStatus?serviceKey=${SERVICE_KEY}&type=json&terno=${terno}`;
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 300 } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const json = await res.json();
  const item = json?.response?.body?.items?.[0];
  if (!item) return null;
  return {
    terno: item.terno,
    seoultaxicnt: Number(item.seoultaxicnt),
    incheontaxicnt: Number(item.incheontaxicnt),
    gyenggitaxicnt: Number(item.gyenggitaxicnt),
    besttaxicnt: Number(item.besttaxicnt),
    vantaxicnt: Number(item.vantaxicnt),
    intercitytaxicnt: Number(item.intercitytaxicnt),
    seoulstandtime: item.seoulstandtime,
    incheonstandtime: item.incheonstandtime,
    gyenggistandtime: item.gyenggistandtime,
    beststandtime: item.beststandtime,
    vanstandtime: item.vanstandtime,
    intercitystandtime: item.intercitystandtime,
    seoultaxistand: item.seoultaxistand,
    incheontaxistand: item.incheontaxistand,
    gyenggitaxistand: item.gyenggitaxistand,
    bestVantaxistand: item.bestVantaxistand,
    intercitytaxistand: item.intercitytaxistand,
    updatetime: item.updatetime,
  };
}

const getCachedTaxi = unstable_cache(
  (terno: string) => fetchTaxiStatus(terno),
  ["taxi-status"],
  { revalidate: 300 }
);

export async function GET(req: NextRequest) {
  try {
    const terminal = req.nextUrl.searchParams.get("terminal") === "T2" ? "P03" : "P01";
    const data = await getCachedTaxi(terminal);
    return Response.json(data);
  } catch {
    return Response.json(null);
  }
}
