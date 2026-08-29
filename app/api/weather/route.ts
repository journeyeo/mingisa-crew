// 기상청 단기예보 + 초단기실황 + 중기예보 — 인천공항 (nx=54, ny=124)
const SERVICE_KEY = process.env.AIRPORT_API_SERVICE_KEY;
const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const MID_BASE = "https://apis.data.go.kr/1360000/MidFcstInfoService";
const NX = 54;
const NY = 124;
const MID_LAND_REG = "11B00000"; // 서울·인천·경기도
const MID_TA_REG   = "11B20201"; // 인천

function kstNow() {
  return new Date(new Date().getTime() + 9 * 3600_000);
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function toTimeStr(d: Date) {
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${h}00`;
}

function vilageFcstBaseTime(kst: Date): { date: string; time: string } {
  const h = kst.getUTCHours();
  const m = kst.getUTCMinutes();
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const effectiveH = m >= 10 ? h : h - 1;
  let base = slots.filter((s) => s <= effectiveH).pop() ?? 23;
  let date = toDateStr(kst);
  if (base === 23 && effectiveH < 23) {
    const prev = new Date(kst.getTime() - 86_400_000);
    date = toDateStr(prev);
  }
  return { date, time: String(base).padStart(2, "0") + "00" };
}

function ultraSrtBaseTime(kst: Date): { date: string; time: string } {
  const h = kst.getUTCHours();
  const m = kst.getUTCMinutes();
  const effectiveH = m >= 40 ? h : h - 1;
  let date = toDateStr(kst);
  let hour = effectiveH;
  if (hour < 0) {
    const prev = new Date(kst.getTime() - 86_400_000);
    date = toDateStr(prev);
    hour = 23;
  }
  return { date, time: String(hour).padStart(2, "0") + "00" };
}

/** 중기예보 tmFc: 0600/1800 발표, 발표 10분 후 안정 */
function midFcstTmFc(kst: Date): string {
  const h = kst.getUTCHours();
  const m = kst.getUTCMinutes();
  const effectiveH = m >= 10 ? h : h - 1;
  let date = toDateStr(kst);
  let slot: string;
  if (effectiveH >= 18) {
    slot = "1800";
  } else if (effectiveH >= 6) {
    slot = "0600";
  } else {
    const prev = new Date(kst.getTime() - 86_400_000);
    date = toDateStr(prev);
    slot = "1800";
  }
  return `${date}${slot}`;
}

async function govFetch<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const json = await res.json();
  const items = json?.response?.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items as T[];
  const item = (items as Record<string, unknown>).item;
  if (!item) return [];
  return Array.isArray(item) ? (item as T[]) : [item as T];
}

interface RawItem {
  category: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
}

export interface CurrentWeather {
  temp: number;
  sky: number;
  pty: number;
  humidity: number;
  windSpeed: number;
  updatedAt: string;
}

export interface HourlyForecast {
  date: string;
  time: string;
  temp: number;
  sky: number;
  pty: number;
  pop: number;
}

export interface DailyForecast {
  date: string;      // YYYYMMDD
  label: string;     // "오늘", "내일", "모레", "목", ...
  skyAm: number;     // 오전 하늘
  ptyAm: number;
  skyPm: number;     // 오후 하늘
  ptyPm: number;
  tmn: number | null;
  tmx: number | null;
  popAm: number;
  popPm: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  tmn: number | null;
  tmx: number | null;
}

function dateLabel(dateStr: string, todayStr: string): string {
  const diff = (parseInt(dateStr) - parseInt(todayStr));
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === 2) return "모레";
  const d = new Date(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(4, 6)) - 1,
    parseInt(dateStr.slice(6, 8))
  );
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
}

export async function GET() {
  if (!SERVICE_KEY) {
    return Response.json({ error: "no key" }, { status: 500 });
  }

  const kst = kstNow();
  const todayStr = toDateStr(kst);

  // ── 초단기실황 ──
  const { date: nDate, time: nTime } = ultraSrtBaseTime(kst);
  const ncstUrl =
    `${BASE}/getUltraSrtNcst` +
    `?serviceKey=${SERVICE_KEY}&dataType=JSON&numOfRows=100` +
    `&base_date=${nDate}&base_time=${nTime}&nx=${NX}&ny=${NY}`;
  const ncstItems = await govFetch<RawItem>(ncstUrl);
  const ncst: Record<string, number> = {};
  for (const it of ncstItems) ncst[it.category] = parseFloat(it.obsrValue ?? "0");

  // ── 단기예보 ──
  const { date: fDate, time: fTime } = vilageFcstBaseTime(kst);
  const fcstUrl =
    `${BASE}/getVilageFcst` +
    `?serviceKey=${SERVICE_KEY}&dataType=JSON&numOfRows=1000` +
    `&base_date=${fDate}&base_time=${fTime}&nx=${NX}&ny=${NY}`;
  const fcstItems = await govFetch<RawItem>(fcstUrl);

  const bySlot: Record<string, Record<string, string>> = {};
  for (const it of fcstItems) {
    const key = `${it.fcstDate}_${it.fcstTime}`;
    if (!bySlot[key]) bySlot[key] = {};
    bySlot[key][it.category] = it.fcstValue ?? "";
  }

  const kstNowStr = toDateStr(kst) + "_" + toTimeStr(kst);
  const tomorrowStr = toDateStr(new Date(kst.getTime() + 86_400_000));

  const hourly: HourlyForecast[] = Object.entries(bySlot)
    .filter(([key]) => { const [d] = key.split("_"); return d === todayStr || d === tomorrowStr; })
    .filter(([key]) => key >= kstNowStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 24)
    .map(([key, vals]) => {
      const [date, time] = key.split("_");
      return {
        date, time,
        temp: parseFloat(vals.TMP ?? "0"),
        sky: parseInt(vals.SKY ?? "1"),
        pty: parseInt(vals.PTY ?? "0"),
        pop: parseInt(vals.POP ?? "0"),
      };
    });

  // 단기 일별 최저/최고 (오늘~모레)
  const shortDailyMap: Record<string, { tmn: number | null; tmx: number | null; skyAm: number; ptyAm: number; skyPm: number; ptyPm: number; popAm: number; popPm: number }> = {};
  for (const [key, vals] of Object.entries(bySlot)) {
    const [date, time] = key.split("_");
    if (!shortDailyMap[date]) shortDailyMap[date] = { tmn: null, tmx: null, skyAm: 1, ptyAm: 0, skyPm: 1, ptyPm: 0, popAm: 0, popPm: 0 };
    const d = shortDailyMap[date];
    if (vals.TMN) d.tmn = parseFloat(vals.TMN);
    if (vals.TMX) d.tmx = parseFloat(vals.TMX);
    const h = parseInt(time.slice(0, 2));
    if (h === 9)  { d.skyAm = parseInt(vals.SKY ?? "1"); d.ptyAm = parseInt(vals.PTY ?? "0"); d.popAm = parseInt(vals.POP ?? "0"); }
    if (h === 15) { d.skyPm = parseInt(vals.SKY ?? "1"); d.ptyPm = parseInt(vals.PTY ?? "0"); d.popPm = parseInt(vals.POP ?? "0"); }
  }

  let tmn: number | null = shortDailyMap[todayStr]?.tmn ?? null;
  let tmx: number | null = shortDailyMap[todayStr]?.tmx ?? null;

  // ── 중기예보 ──
  const tmFc = midFcstTmFc(kst);
  const [midLand, midTa] = await Promise.all([
    govFetch<Record<string, string>>(
      `${MID_BASE}/getMidLandFcst?serviceKey=${SERVICE_KEY}&dataType=JSON&numOfRows=10&regId=${MID_LAND_REG}&tmFc=${tmFc}`
    ),
    govFetch<Record<string, string>>(
      `${MID_BASE}/getMidTa?serviceKey=${SERVICE_KEY}&dataType=JSON&numOfRows=10&regId=${MID_TA_REG}&tmFc=${tmFc}`
    ),
  ]);

  const land = midLand[0] ?? {};
  const ta   = midTa[0]   ?? {};

  // 중기는 D+3~D+7 (단기예보 이후)
  const daily: DailyForecast[] = [];

  // 단기 분 (오늘~모레, D+0~D+2)
  for (let d = 0; d <= 2; d++) {
    const date = toDateStr(new Date(kst.getTime() + d * 86_400_000));
    const sd = shortDailyMap[date];
    if (!sd) continue;
    daily.push({
      date,
      label: dateLabel(date, todayStr),
      skyAm: sd.skyAm, ptyAm: sd.ptyAm,
      skyPm: sd.skyPm, ptyPm: sd.ptyPm,
      tmn: sd.tmn, tmx: sd.tmx,
      popAm: sd.popAm, popPm: sd.popPm,
    });
  }

  // 중기 분 (D+3~D+7)
  const wfMap: Record<string, number> = { "맑음": 1, "구름조금": 1, "구름많음": 3, "구름많고 비": 1, "흐림": 4, "흐리고 비": 4, "흐리고 눈": 4, "흐리고 비/눈": 4, "비": 1, "눈": 1, "비/눈": 1 };
  const wfPty: Record<string, number> = { "흐리고 비": 1, "흐리고 눈": 3, "흐리고 비/눈": 2, "비": 1, "눈": 3, "비/눈": 2, "구름많고 비": 1 };
  function parseSky(wf: string): number { return wfMap[wf] ?? 1; }
  function parsePty(wf: string): number { return wfPty[wf] ?? 0; }

  for (let d = 3; d <= 7; d++) {
    const date = toDateStr(new Date(kst.getTime() + d * 86_400_000));
    const wfAm = land[`wf${d}Am`] ?? "";
    const wfPm = land[`wf${d}Pm`] ?? "";
    if (!wfAm && !wfPm) continue;
    daily.push({
      date,
      label: dateLabel(date, todayStr),
      skyAm: parseSky(wfAm), ptyAm: parsePty(wfAm),
      skyPm: parseSky(wfPm), ptyPm: parsePty(wfPm),
      tmn: ta[`taMin${d}`] ? parseFloat(ta[`taMin${d}`]) : null,
      tmx: ta[`taMax${d}`] ? parseFloat(ta[`taMax${d}`]) : null,
      popAm: parseInt(land[`rnSt${d}Am`] ?? "0"),
      popPm: parseInt(land[`rnSt${d}Pm`] ?? "0"),
    });
  }

  const nearestSky = hourly[0]?.sky ?? 1;
  const nearestTemp = hourly[0]?.temp ?? 0;

  const current: CurrentWeather = {
    temp: ncst.T1H !== undefined && ncst.T1H !== 0 ? ncst.T1H : nearestTemp,
    sky: nearestSky,
    pty: ncst.PTY ?? hourly[0]?.pty ?? 0,
    humidity: ncst.REH ?? 0,
    windSpeed: ncst.WSD ?? 0,
    updatedAt: new Date().toISOString(),
  };

  return Response.json({ current, hourly, daily, tmn, tmx } satisfies WeatherData);
}
