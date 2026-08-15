import type {
  ArrivalCongestionItem,
  FlightStatusItem,
  PassengerForecastItem,
  ParkingItem,
  WeeklyFlightItem,
} from "./types";

function todayDT(hour: number, minute: number): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${y}${mo}${dy}${hh}${mm}`;
}

function hhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
}

// ─── 입국장현황 (ArrivalCongestionItem) ──────────────────────────────────────

export const MOCK_ARRIVALS_T1: ArrivalCongestionItem[] = [
  {
    flightid: "TG656",
    terno: "T1",
    entrygate: "D",
    korean: "168.0",
    foreigner: "412.0",
    scheduletime: todayDT(22, 15),
    estimatedtime: todayDT(22, 15),
    airport: "BKK",
    gatenumber: "128",
  },
  {
    flightid: "VJ962",
    terno: "T1",
    entrygate: "D",
    korean: "20.0",
    foreigner: "360.0",
    scheduletime: todayDT(22, 40),
    estimatedtime: todayDT(22, 52),
    airport: "SGN",
    gatenumber: "115",
  },
  {
    flightid: "PR468",
    terno: "T1",
    entrygate: "D",
    korean: "25.0",
    foreigner: "395.0",
    scheduletime: todayDT(23, 10),
    estimatedtime: todayDT(23, 35),
    airport: "MNL",
    gatenumber: "132",
  },
  {
    flightid: "CI160",
    terno: "T1",
    entrygate: "D",
    korean: "80.0",
    foreigner: "210.0",
    scheduletime: todayDT(23, 5),
    estimatedtime: todayDT(23, 5),
    airport: "TPE",
    gatenumber: "127",
  },
  {
    flightid: "KE701",
    terno: "T1",
    entrygate: "D",
    korean: "140.0",
    foreigner: "180.0",
    scheduletime: todayDT(0, 15),
    estimatedtime: todayDT(0, 15),
    airport: "NRT",
    gatenumber: "118",
  },
];

export const MOCK_ARRIVALS_T2: ArrivalCongestionItem[] = [
  {
    flightid: "OZ101",
    terno: "T2",
    entrygate: "D",
    korean: "170.0",
    foreigner: "320.0",
    scheduletime: todayDT(21, 30),
    estimatedtime: todayDT(21, 30),
    airport: "LAX",
    gatenumber: "230",
  },
  {
    flightid: "DL159",
    terno: "T2",
    entrygate: "D",
    korean: "30.0",
    foreigner: "350.0",
    scheduletime: todayDT(22, 50),
    estimatedtime: todayDT(23, 20),
    airport: "JFK",
    gatenumber: "245",
  },
];

// ─── 여객편 운항현황 (FlightStatusItem) ──────────────────────────────────────

export const MOCK_FLIGHTS_T1: FlightStatusItem[] = [
  {
    flightId: "TG656",
    airline: "Thai Airways",
    airport: "방콕(BKK)",
    scheduleDateTime: hhmm(22, 15),
    estimatedDateTime: hhmm(22, 15),
    exitnumber: "5",
    gatenumber: "128",
    carousel: "3",
    terminalId: "P01",
    remark: "",
    airportCode: "BKK",
    cityCode: "BKK",
  },
  {
    flightId: "VJ962",
    airline: "VietJet Air",
    airport: "호치민(SGN)",
    scheduleDateTime: hhmm(22, 40),
    estimatedDateTime: hhmm(22, 52),
    exitnumber: "6",
    gatenumber: "115",
    carousel: "4",
    terminalId: "P01",
    remark: "지연",
    airportCode: "SGN",
    cityCode: "SGN",
  },
  {
    flightId: "PR468",
    airline: "Philippine Airlines",
    airport: "마닐라(MNL)",
    scheduleDateTime: hhmm(23, 10),
    estimatedDateTime: hhmm(23, 35),
    exitnumber: "7",
    gatenumber: "132",
    carousel: "5",
    terminalId: "P01",
    remark: "지연",
    airportCode: "MNL",
    cityCode: "MNL",
  },
  {
    flightId: "CI160",
    airline: "China Airlines",
    airport: "타이베이(TPE)",
    scheduleDateTime: hhmm(23, 5),
    estimatedDateTime: hhmm(23, 5),
    exitnumber: "5",
    gatenumber: "127",
    carousel: "2",
    terminalId: "P01",
    remark: "",
    airportCode: "TPE",
    cityCode: "TPE",
  },
  {
    flightId: "KE701",
    airline: "Korean Air",
    airport: "도쿄(NRT)",
    scheduleDateTime: hhmm(0, 15),
    estimatedDateTime: hhmm(0, 15),
    exitnumber: "6",
    gatenumber: "118",
    carousel: "1",
    terminalId: "P02",
    remark: "",
    airportCode: "NRT",
    cityCode: "TYO",
  },
];

export const MOCK_FLIGHTS_T2: FlightStatusItem[] = [
  {
    flightId: "OZ101",
    airline: "Asiana Airlines",
    airport: "LA(LAX)",
    scheduleDateTime: hhmm(21, 30),
    estimatedDateTime: hhmm(21, 30),
    exitnumber: "1",
    gatenumber: "230",
    carousel: "1",
    terminalId: "S01",
    remark: "",
    airportCode: "LAX",
    cityCode: "LAX",
  },
  {
    flightId: "DL159",
    airline: "Delta Air Lines",
    airport: "뉴욕(JFK)",
    scheduleDateTime: hhmm(22, 50),
    estimatedDateTime: hhmm(23, 20),
    exitnumber: "2",
    gatenumber: "245",
    carousel: "2",
    terminalId: "S01",
    remark: "지연",
    airportCode: "JFK",
    cityCode: "NYC",
  },
];

// ─── 승객예고 (PassengerForecastItem) ────────────────────────────────────────

const TODAY = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}${mo}${dy}`;
})();

export const MOCK_PASSENGERS: PassengerForecastItem[] = [
  { adate: TODAY, atime: "18_19", t1egsum1: "120", t1dgsum1: "95",  t2egsum1: "80",  t2dgsum2: "60" },
  { adate: TODAY, atime: "19_20", t1egsum1: "200", t1dgsum1: "155", t2egsum1: "130", t2dgsum2: "95" },
  { adate: TODAY, atime: "20_21", t1egsum1: "310", t1dgsum1: "240", t2egsum1: "200", t2dgsum2: "150" },
  { adate: TODAY, atime: "21_22", t1egsum1: "420", t1dgsum1: "325", t2egsum1: "270", t2dgsum2: "200" },
  { adate: TODAY, atime: "22_23", t1egsum1: "510", t1dgsum1: "395", t2egsum1: "330", t2dgsum2: "245" },
  { adate: TODAY, atime: "23_00", t1egsum1: "520", t1dgsum1: "400", t2egsum1: "340", t2dgsum2: "250" },
  { adate: TODAY, atime: "00_01", t1egsum1: "380", t1dgsum1: "290", t2egsum1: "240", t2dgsum2: "180" },
  { adate: TODAY, atime: "01_02", t1egsum1: "210", t1dgsum1: "160", t2egsum1: "135", t2dgsum2: "100" },
  { adate: TODAY, atime: "02_03", t1egsum1: "80",  t1dgsum1: "62",  t2egsum1: "50",  t2dgsum2: "38" },
  { adate: TODAY, atime: "03_04", t1egsum1: "20",  t1dgsum1: "15",  t2egsum1: "12",  t2dgsum2: "9" },
  { adate: TODAY, atime: "04_05", t1egsum1: "5",   t1dgsum1: "4",   t2egsum1: "3",   t2dgsum2: "2" },
  { adate: TODAY, atime: "05_06", t1egsum1: "15",  t1dgsum1: "12",  t2egsum1: "10",  t2dgsum2: "8" },
];

// ─── 주차 현황 (ParkingItem) ─────────────────────────────────────────────────

export const MOCK_PARKING: ParkingItem[] = [
  { floor: "T1 단기주차장지하1층", parking: "2780", parkingarea: "3200", datetm: `${TODAY}090000.000` },
  { floor: "T1 장기주차장지하1층", parking: "3100", parkingarea: "5600", datetm: `${TODAY}090000.000` },
  { floor: "T2 단기주차장지하1층", parking: "1540", parkingarea: "2800", datetm: `${TODAY}090000.000` },
  { floor: "T2 장기주차장지하1층", parking: "2100", parkingarea: "4200", datetm: `${TODAY}090000.000` },
];

// ─── 주간 운항현황 (WeeklyFlightItem) ────────────────────────────────────────

function offsetDT(offsetDays: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${y}${mo}${dy}${hh}${mm}`;
}

function dayMultiplier(offsetDays: number): number {
  const dow = new Date(new Date().setDate(new Date().getDate() + offsetDays)).getDay();
  return dow === 5 ? 1.4 : dow === 6 ? 1.3 : dow === 0 ? 1.2 : 1.0;
}

function generateDayFlights(offsetDays: number): WeeklyFlightItem[] {
  const mult = dayMultiplier(offsetDays);
  const base: { h: number; m: number; id: string; airline: string; ap: string; code: string; tid: string }[] = [
    { h: 19, m: 10, id: "KE701",  airline: "Korean Air",            ap: "도쿄(NRT)",         code: "NRT", tid: "P01" },
    { h: 20, m: 25, id: "OZ102",  airline: "Asiana Airlines",       ap: "오사카(KIX)",        code: "KIX", tid: "P01" },
    { h: 20, m: 50, id: "TG657",  airline: "Thai Airways",          ap: "방콕(BKK)",          code: "BKK", tid: "P01" },
    { h: 21, m: 30, id: "CX419",  airline: "Cathay Pacific",        ap: "홍콩(HKG)",          code: "HKG", tid: "P01" },
    { h: 21, m: 55, id: "SQ602",  airline: "Singapore Airlines",    ap: "싱가포르(SIN)",       code: "SIN", tid: "S01" },
    { h: 22, m: 15, id: "TG656",  airline: "Thai Airways",          ap: "방콕(BKK)",          code: "BKK", tid: "P01" },
    { h: 22, m: 40, id: "VJ962",  airline: "VietJet Air",           ap: "호치민(SGN)",        code: "SGN", tid: "P01" },
    { h: 22, m: 50, id: "DL159",  airline: "Delta Air Lines",       ap: "뉴욕(JFK)",          code: "JFK", tid: "S01" },
    { h: 23, m:  5, id: "CI160",  airline: "China Airlines",        ap: "타이베이(TPE)",       code: "TPE", tid: "P01" },
    { h: 23, m: 10, id: "PR468",  airline: "Philippine Airlines",   ap: "마닐라(MNL)",        code: "MNL", tid: "P01" },
    { h: 23, m: 40, id: "MH066",  airline: "Malaysia Airlines",     ap: "쿠알라룸푸르(KUL)",  code: "KUL", tid: "P01" },
    { h:  0, m: 15, id: "KE012",  airline: "Korean Air",            ap: "파리(CDG)",          code: "CDG", tid: "S01" },
    { h:  0, m: 30, id: "UA896",  airline: "United Airlines",       ap: "LA(LAX)",            code: "LAX", tid: "S01" },
    { h:  1, m: 20, id: "EK322",  airline: "Emirates",              ap: "두바이(DXB)",        code: "DXB", tid: "S01" },
    { h:  2, m: 10, id: "QR858",  airline: "Qatar Airways",         ap: "도하(DOH)",          code: "DOH", tid: "S01" },
  ];

  const extra = mult >= 1.3
    ? [
        { h: 21, m:  0, id: "JL092", airline: "Japan Airlines",  ap: "도쿄(HND)",     code: "HND", tid: "P01" },
        { h: 22, m: 20, id: "NH856", airline: "ANA",              ap: "오사카(KIX)",    code: "KIX", tid: "P01" },
        { h: 23, m: 50, id: "5J688", airline: "Cebu Pacific",     ap: "세부(CEB)",      code: "CEB", tid: "P01" },
      ]
    : mult >= 1.2
    ? [{ h: 22, m: 5, id: "LJ203", airline: "Jin Air", ap: "후쿠오카(FUK)", code: "FUK", tid: "P01" }]
    : [];

  return [...base, ...extra].map((f) => ({
    flightId: f.id,
    airline: f.airline,
    airport: f.ap,
    scheduleDateTime: offsetDT(offsetDays, f.h, f.m),
    estimatedDateTime: "",
    terminalid: f.tid,
    exitnumber: "",
    gatenumber: "",
    remark: "",
    airportCode: f.code,
  }));
}

export const MOCK_WEEKLY: WeeklyFlightItem[] = Array.from({ length: 7 }, (_, i) =>
  generateDayFlights(i)
).flat();
