import type { ParkingLot, ParkingSummary } from "@/lib/airport/types";

interface Props {
  parking: ParkingSummary;
}

const LEVEL_STYLE: Record<string, { barColor: string; textColor: string; bgColor: string }> = {
  여유: { barColor: "#81C784", textColor: "#BF360C", bgColor: "#FDF8EE" },
  보통: { barColor: "#1B5E36", textColor: "#BF360C", bgColor: "#E8F5E9" },
  혼잡: { barColor: "#A86E20", textColor: "#7A4E10", bgColor: "#FAEBD4" },
  만차: { barColor: "#E65100", textColor: "#E65100", bgColor: "#FFF3E0" },
};

function LotRow({ label, lot }: { label: string; lot: ParkingLot }) {
  const style = LEVEL_STYLE[lot.level] ?? LEVEL_STYLE["보통"];
  const pct = Math.min(Math.round(lot.rate * 100), 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{lot.occupied.toLocaleString()} / {lot.capacity.toLocaleString()}대</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ color: style.textColor, background: style.bgColor }}
          >
            {lot.level}
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: style.barColor }}
        />
      </div>
    </div>
  );
}

export function ParkingStatus({ parking }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-400">주차 현황</p>
        <span className="text-xs font-bold text-[#E65100]">{parking.terminal}</span>
      </div>
      <LotRow label="단기" lot={parking.shortTerm} />
      <LotRow label="장기" lot={parking.longTerm} />
    </div>
  );
}
