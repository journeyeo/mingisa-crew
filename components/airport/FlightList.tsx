import type { HourlySlot } from "@/lib/airport/types";
import { formatTime } from "@/lib/airport/transform";

interface Props {
  slots: HourlySlot[];
}

export function FlightList({ slots }: Props) {
  const activeSlots = slots.filter((s) => s.flights.length > 0);

  if (activeSlots.length === 0) {
    return <p className="text-gray-400 text-base py-6">이 시간대 운항편 없음</p>;
  }

  return (
    <div className="space-y-3">
      {activeSlots.map((slot) => (
        <div
          key={slot.hour}
          className={`rounded-2xl border shadow-sm overflow-hidden ${
            slot.isNoTransport ? "border-rose-100 bg-rose-50" : "border-gray-100 bg-white"
          }`}
        >
          {/* 슬롯 헤더 */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            slot.isNoTransport ? "border-rose-100" : "border-gray-100"
          }`}>
            <p className="text-sm font-semibold text-gray-600">
              {String(slot.hour).padStart(2, "0")}:00 · {slot.flights.length}편
            </p>
            {slot.isNoTransport && (
              <span className="text-xs font-semibold text-rose-500">대중교통 없음</span>
            )}
          </div>

          {/* 컬럼 헤더 */}
          <div className="flex items-center px-4 pt-2 pb-1 gap-3 text-xs text-gray-400">
            <span className="w-24 shrink-0">편명</span>
            <span className="flex-1">출발지</span>
            <span className="w-28 text-right">착륙 · 출구 도착</span>
          </div>

          {/* 항공편 행 */}
          <div className="divide-y divide-gray-100">
            {slot.flights.map((flight) => (
              <div
                key={flight.id}
                className={`flex items-center px-4 py-3.5 gap-3 ${flight.isDelayed ? "bg-rose-50/60" : ""}`}
              >
                {/* 편명 + 지연 뱃지 */}
                <div className="w-24 shrink-0 flex flex-col items-start gap-0.5">
                  <span className="text-base font-mono font-bold text-gray-900">
                    {flight.id}
                  </span>
                  {flight.isDelayed && (
                    <span className="text-xs font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-md leading-none">
                      지연
                    </span>
                  )}
                </div>

                {/* 출발지 */}
                <span className="flex-1 text-base text-gray-500 truncate">
                  {flight.origin}
                </span>

                {/* 착륙 · 출구 도착 — 둘 다 표시 */}
                <div className="w-28 text-right shrink-0">
                  <p className="text-xs text-gray-400 tabular-nums">
                    착륙 {formatTime(flight.landingTime)}
                  </p>
                  <p className="text-base font-semibold tabular-nums text-gray-900 leading-tight">
                    출구 {formatTime(flight.exitTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
