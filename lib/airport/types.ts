export type Terminal = "T1" | "T2";
export type TimeBasis = "exit" | "landing";

// 공공데이터포털 공통 응답 래퍼
interface GovApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: T | T[] };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 승객예고 API (getPassgrAnncmt)
export interface PassengerForecastItem {
  adate: string;       // "20260811"
  atime: string;       // "00_01" (시간대 범위)
  t1egsum1: string;    // T1 입국장 합계
  t1dgsum1: string;    // T1 출국장 합계
  t2egsum1: string;    // T2 입국장 합계
  t2dgsum2: string;    // T2 출국장 합계
  [key: string]: string;
}

// 입국장현황 API (getArrivalsCongestion)
export interface ArrivalCongestionItem {
  flightid: string;
  terno: string;        // "T1" / "T2"
  entrygate: string;    // 입국장 구분
  korean: string;       // 내국인 대기인원
  foreigner: string;    // 외국인 대기인원
  scheduletime: string; // "202608112040" (YYYYMMDDHHMM)
  estimatedtime: string;
  airport: string;      // 출발 공항 코드
  gatenumber: string;
}

// 여객편 운항현황 API (getPassengerArrivalsOdp)
export interface FlightStatusItem {
  flightId: string;         // camelCase
  airline: string;
  airport: string;          // 출발지명
  scheduleDateTime: string; // "2355" (HHMM, 4자)
  estimatedDateTime: string;
  exitnumber: string;
  gatenumber: string;
  carousel: string;
  terminalId: string;       // "P01" / "S01"
  remark: string;
  airportCode: string;
  cityCode: string;
}

// 앱 내부 공통 항공편 타입 (두 API 병합)
export interface Flight {
  id: string;
  airline: string;
  origin: string;
  terminal: Terminal;
  scheduledTime: Date;  // 예정 착륙 시각
  landingTime: Date;
  exitTime: Date;       // 착륙 + 출구 소요시간
  exitGate: string;
  isDelayed: boolean;
  foreignWaiting: number;
  totalWaiting: number;
}

// 시간대별 집계
export interface HourlySlot {
  hour: number;         // 0~23
  date?: string;        // YYYYMMDD — 날짜 경계 식별용
  foreignCount: number;
  domesticCount: number;
  flightCount: number;
  isNoTransport: boolean; // 막차 이후 구간
  flights: Flight[];
}

// 여객편 주간 운항현황 API (getPassengerArrivalsDSOdp)
export interface WeeklyFlightItem {
  flightId: string;         // camelCase
  airline: string;
  airport: string;
  scheduleDateTime: string; // "202608102355" (YYYYMMDDHHMM, 12자)
  estimatedDateTime: string;
  terminalid: string;       // "P01" / "S01"
  exitnumber: string;
  gatenumber: string;
  remark: string;
  airportCode: string;
}

// 날짜별 시간대 집계 (주간 뷰용)
export interface DailyHourlySlot {
  hour: number;
  flightCount: number;
  isNoTransport: boolean;
}

export interface WeeklyDay {
  date: string;           // YYYYMMDD
  label: string;          // "오늘", "내일", "목", "금" ...
  dayOfWeek: string;      // "월" ~ "일"
  slots: DailyHourlySlot[];
  totalFlights: number;
  goldenHourFlights: number; // 막차 이후 편수
}

// 주차 정보 API (getTrackingParking)
export interface ParkingItem {
  floor: string;       // "T1 단기주차장지하1층"
  parking: string;     // 현재 주차 차량 수
  parkingarea: string; // 총 주차면
  datetm: string;      // "20260811223502.000"
}

export interface ParkingLot {
  capacity: number;
  occupied: number;
  rate: number;
  level: "여유" | "보통" | "혼잡" | "만차";
}

export interface ParkingSummary {
  terminal: Terminal;
  capacity: number;
  occupied: number;
  rate: number;            // 0~1
  shortTerm: ParkingLot;
  longTerm: ParkingLot;
  level: "여유" | "보통" | "혼잡" | "만차";
}

// 기사 체크인
export interface CheckinRecord {
  id: string;
  driverName: string;
  terminal: Terminal;
  enteredAt: string;   // ISO string
  boardedAt?: string;
}

export interface CheckinStats {
  active: CheckinRecord[];
  avgWaitMinutes: number | null;
  recentCompletions: CheckinRecord[];
}
