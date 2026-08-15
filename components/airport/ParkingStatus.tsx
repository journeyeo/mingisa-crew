import type { ParkingSummary } from "@/lib/airport/types";

interface Props {
  parking: ParkingSummary;
}

// 여유 → 보통 → 혼잡: 골드 계열 / 만차: 와인
const LEVEL_STYLE: Record<string, { barColor: string; textColor: string; bgColor: string }> = {
  여유: { barColor: "#E8C47A", textColor: "#9A7020", bgColor: "#FDF8EE" },
  보통: { barColor: "#C4933F", textColor: "#9A7020", bgColor: "#FDF3DE" },
  혼잡: { barColor: "#A86E20", textColor: "#7A4E10", bgColor: "#FAEBD4" },
  만차: { barColor: "#9B1B30", textColor: "#9B1B30", bgColor: "#FDF0F2" },
};

export function ParkingStatus({ parking }: Props) {
  const { level, rate, occupied, capacity } = parking;
  const style = LEVEL_STYLE[level] ?? LEVEL_STYLE["보통"];
  const pct = Math.round(rate * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">주차 혼잡도</p>
        <span
          className="text-sm font-bold px-2.5 py-1 rounded-full"
          style={{ color: style.textColor, background: style.bgColor }}
        >
          {level}
        </span>
      </div>

      {/* 점유율 바 */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: style.barColor }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-400">
        <span>{occupied.toLocaleString()} / {capacity.toLocaleString()}대</span>
        <span className="font-semibold text-gray-700">{pct}%</span>
      </div>

      {/* 해석 힌트 */}
      {level === "혼잡" || level === "만차" ? (
        <p className="text-xs text-gray-400 mt-2.5">
          주차가 차면 마중 나온 자가용이 많다는 뜻 → 택시 수요 ↓
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-2.5">
          주차 여유 → 자가용 마중 적음 → 택시 수요 ↑
        </p>
      )}
    </div>
  );
}
