import type { Terminal } from "./types";

// 공항철도 (AREX) 시간표 — 개정 시 수동 업데이트
export const AREX = {
  lastTrain: { hour: 23, minute: 50 },  // 인천공항 → 서울역 막차
  firstTrain: { hour: 5, minute: 20 },  // 인천공항 → 서울역 첫차
};

// 주요 리무진 막차 (출발지: 인천공항)
export const LIMOUSINE_LAST_TRAINS: { name: string; hour: number; minute: number }[] = [
  { name: "강남행 6001", hour: 23, minute: 0 },
  { name: "잠실행 6000", hour: 23, minute: 30 },
  { name: "수원행 6003", hour: 22, minute: 50 },
  { name: "인천시내 심야", hour: 0, minute: 30 },
];

// 막차가 가장 늦은 시각 (이 이후가 택시 황금 구간)
export const NO_TRANSPORT_START = AREX.lastTrain; // 23:50
export const NO_TRANSPORT_END = AREX.firstTrain;  // 05:20

/** 주어진 시각이 대중교통 공백 구간인지 판단 */
export function isNoTransportHour(hour: number): boolean {
  // 23:50 이후 or 05:20 이전 = 대중교통 없음
  return hour >= 24 || hour <= 4 || (hour === 5 && false) || hour === 23;
  // 23시는 막차가 23:50이라 정확히는 23:50부터지만 시간 단위로 표시할 때 23시를 포함
}

/** 더 정확한 분 단위 판단 */
export function isNoTransport(hour: number, minute: number): boolean {
  const totalMin = hour * 60 + minute;
  const cutoff = 23 * 60 + 50;
  const firstTrain = 5 * 60 + 20;
  return totalMin >= cutoff || totalMin < firstTrain;
}

// 출구 도착 소요시간 (착륙 기준)
export const EXIT_DELAY = {
  foreigner: { min: 50, max: 70 },   // 외국인: 자동출입국 불가, 더 오래 걸림
  korean: { min: 30, max: 50 },
  average: 55,                        // 기본값 (외국인 기준 중간값)
} as const;

// 터미널 표시명
export const TERMINAL_LABEL: Record<Terminal, string> = {
  T1: "제1터미널",
  T2: "제2터미널",
  GMP: "김포공항",
};

// 대시보드에서 보여줄 시간 범위 (18시~익일 06시)
export const CHART_START_HOUR = 18;
export const CHART_END_HOUR = 6; // 익일
export const CHART_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
