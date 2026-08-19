# 공공데이터 API 현황

출처: [공공데이터포털](https://www.data.go.kr) — 인천국제공항공사 제공  
Base URL: `https://apis.data.go.kr/B551177`

| API 명 | 엔드포인트 | 일 한도 | 계정 | UI 사용 | 비고 |
|--------|-----------|---------|------|---------|------|
| 여객편 운항현황(다국어) | `StatusOfPassengerFlightsOdp/getPassengerArrivalsOdp` | 1,000,000 | 운영 | ✅ | 당일 실시간 도착편 |
| 입국장별 혼잡도 현황 | `StatusOfArrivals/getArrivalsCongestion` | 운영 | 운영 | ✅ | T1/T2 각각 호출 (일 576건) |
| 주간 운항현황 | `StatusOfPassengerFlightsDSOdp/getPassengerArrivalsDSOdp` | 운영 | 운영 | ✅ | T1/T2 각각 호출 (일 576건), 출발편 활용 예정 |
| 승객 예고 | `passgrAnncmt/getPassgrAnncmt` | 1,000 | 개발 | ✅ | 터미널 구분 없음 (일 288건) |
| 주차 현황 | `StatusOfParking/getTrackingParking` | 1,000 | 개발 | ❌ | 미사용, 추후 기능 추가 시 신청 |
| 여객기 운항현황 상세(출발+도착) | `StatusOfPassengerFlightsDeOdp` | 500 / 운영 100,000 | 개발 신청 | ❌ | 출발편 + D-3~D+6, 출발편 기능 추가 시 활용 예정 |
| 택시출차 현황 | `StatusOfTaxi/getTaxiStatus` | 1,000 / 운영 자동승인 | 개발 신청 | ❌ | 서울·인천·경기·인터시티·우등·대형 택시 대수 및 대기시간 |

## 호출 주기

- 캐시 갱신: `revalidate: 300` (5분)
- T1/T2 별도 캐시 → 터미널 구분 있는 API는 일 호출 수 × 2 (일 576건)

## 운영계정 신청 기준

일 한도 대비 실제 호출 수가 초과하거나 여유가 부족한 경우 운영계정 신청.  
T1/T2 모두 활성화 시 5분 캐시 기준 일 576건 발생하므로, 한도 500인 API는 운영계정 필요.
