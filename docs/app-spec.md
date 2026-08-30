# 민기사 크루 — 앱 스펙

기사용 공항 수요 모니터링 앱. 인천(T1·T2)·김포 공항의 실시간 입국 현황, 시간대별 승객 수요, 날씨 등을 한눈에 확인할 수 있다.

---

## 개요

| 항목 | 내용 |
|------|------|
| 앱 이름 | 민기사 크루 |
| 패키지 ID | `com.mingisa.crew` |
| 대상 | 민기사 소속 드라이버 |
| 웹 URL | `https://crew.mingisa.com` |
| 플랫폼 | Android (Capacitor), PWA |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 차트 | Chart.js + react-chartjs-2 |
| 네이티브 앱 | Capacitor v7 (Android) |
| 배포 | Vercel (`crew.mingisa.com`) |
| 앱 배포 | Google Play Store |

Capacitor는 `server.url`을 `https://crew.mingisa.com`으로 지정해 웹뷰로 로드하는 방식 (정적 export 아님).

---

## 화면 구성

### 메인 (`/airport`)

터미널 탭(T1 · T2 · GMP)으로 전환. 기본값 T1.

| 컴포넌트 | 설명 |
|----------|------|
| `DashboardHeader` | 터미널 선택 탭 + 현재 시각 |
| `PassengerChart` | 시간대별 입국 승객 수 막대그래프 (당일 실적 + 예고 데이터) |
| `FlightList` / `FlightListSlider` | 도착 예정 항공편 목록 (편명·출발지·예정·실제 시각·게이트) |
| `ArrivalGateStatus` | 입국장별 혼잡도 (T1·T2) |
| `TaxiStatus` | 공항 택시 대기 현황 |
| `ParkingStatus` | 주차장 여유 현황 |
| `WeeklyForecast` | 주간 항공편 운항 예보 |
| `CheckinPanel` | 드라이버 자체 일정 메모 |
| `WeatherWidget` | 현재 날씨 |
| `FloatingScrollNav` | 섹션 간 빠른 이동 |

### 기타 라우트

| 경로 | 내용 |
|------|------|
| `/` | `/airport` 로 redirect |
| `/airport?terminal=T2` | T2 탭 직접 진입 |
| `/airport?terminal=GMP` | 김포공항 뷰 |
| `/privacy` | 개인정보처리방침 (Play Store 제출용) |

---

## 공공 API 연동

### 인천국제공항공사 (`apis.data.go.kr/B551177`)

| 기능 | 엔드포인트 | 비고 |
|------|-----------|------|
| 당일 도착편 현황 | `getPassengerArrivalsOdp` | T1·T2 각각 호출 |
| 입국장 혼잡도 | `getArrivalsCongestion` | T1·T2 각각 |
| 주간 운항 예보 | `getPassengerArrivalsDSOdp` | 출발편 활용 예정 |
| 승객 예고 | `getPassgrAnncmt` | 터미널 구분 없음 |

### 한국공항공사 (`apis.data.go.kr/B551178`)

| 기능 | 엔드포인트 | 비고 |
|------|-----------|------|
| 실시간 항공편 | `flight-status/detail` | 김포(GMP) 전체 fetch 후 클라이언트 필터 |

### 캐싱 전략

- `revalidate: 300` (5분 ISR)
- T1·T2 별도 캐시 → 터미널 구분 API는 일 호출 수 × 2
- 김포: 페이지당 100건 × 약 50페이지 fetch → 1회 갱신 시 50 API 호출
- cron-job.org에서 `/api/airport/warmup` 주기적 호출로 캐시 워밍업

---

## 데이터 흐름

```
공공 API
  ↓  (Next.js Route Handler, 5분 캐시)
/api/airport/*  /api/gimpo/*  /api/weather/*
  ↓
AirportDashboard (클라이언트 컴포넌트)
  ↓
PassengerChart / FlightList / ArrivalGateStatus / ...
```

lib 구조:
- `lib/airport/api-client.ts` — 공공 API fetch 래퍼
- `lib/airport/transform.ts` — 응답 → UI 데이터 변환
- `lib/airport/types.ts` — 공통 타입 (`Terminal`, `Flight`, ...)
- `lib/airport/estimate-minutes.ts` — 도착까지 남은 시간 계산
- `lib/airport/constants.ts` — 터미널·게이트 상수

---

## PWA / 앱 설정

- `manifest.ts` — 홈화면 추가 지원 (아이콘, `standalone` 모드)
- `ServiceWorkerRegister` — 오프라인 대응
- Capacitor `server.url` 방식 → 앱 업데이트 없이 웹 배포만으로 내용 갱신 가능

---

## 배포

| 채널 | 방법 |
|------|------|
| 웹 | Vercel 자동 배포 (main push) |
| Android | `npx cap sync android` → Android Studio 빌드 → Play Store 내부 테스트 트랙 |

Play Store 패키지: `com.mingisa.crew`  
릴리스 절차: [android-playstore-release.md](./android-playstore-release.md) 참고
