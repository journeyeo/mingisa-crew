import type { HourlySlot, Terminal } from "@/lib/airport/types";

interface Props {
  terminal: Terminal;
  currentForeignWaiting: number;
  currentTotalWaiting: number;
  peakSlot: HourlySlot | null;
  now: string;
  tomorrowLabel: string;
}

export function DashboardHeader({ currentForeignWaiting, currentTotalWaiting, peakSlot, now, tomorrowLabel }: Props) {
  const d = new Date(now);
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const isPeakTomorrow = d.getHours() >= 18 && peakSlot !== null && peakSlot.hour <= 5;
  const peakHour = peakSlot ? `${String(peakSlot.hour).padStart(2, "0")}시` : "—";
  const peakFlights = peakSlot?.flightCount ?? 0;
  const tomorrowDateLabel = tomorrowLabel
    ? `${parseInt(tomorrowLabel.split("/")[0])}월 ${parseInt(tomorrowLabel.split("/")[1])}일`
    : "";
  const domesticWaiting = currentTotalWaiting - currentForeignWaiting;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <p className="text-sm text-gray-500 mb-2">입국장 대기</p>
        <div className="space-y-1.5">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">외국인</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-bold tabular-nums leading-none text-gray-900">
                {currentForeignWaiting.toLocaleString()}
              </span>
              <span className="text-sm font-normal text-gray-500">명</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">내국인</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-bold tabular-nums leading-none text-gray-700">
                {domesticWaiting.toLocaleString()}
              </span>
              <span className="text-sm font-normal text-gray-500">명</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <p className="text-sm text-gray-500 mb-2">다음 피크</p>
        <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">{peakHour}</p>
        <p className="text-xs text-gray-500 mt-2">
          {isPeakTomorrow && tomorrowDateLabel ? tomorrowDateLabel : ""}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className="text-3xl font-bold tabular-nums leading-none text-gray-900">{value}</p>
      {unit && <p className="text-sm text-gray-500 mt-1">{unit}</p>}
    </div>
  );
}
