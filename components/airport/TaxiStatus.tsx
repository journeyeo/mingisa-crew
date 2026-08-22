"use client";

import type { TaxiStatus } from "@/app/api/airport/taxi/route";

function parseMin(t: string): number {
  if (!t || t === "0000") return 0;
  return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2, 4), 10);
}

function fmtMin(t: string): string {
  const m = parseMin(t);
  if (m === 0) return "";
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

interface StandCellProps {
  count: number;
  standtime: string;
}

function StandCell({ count, standtime }: StandCellProps) {
  const waitMin = parseMin(standtime);
  const hasWait = waitMin > 0;
  return (
    <td className="py-3 text-center">
      {hasWait ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-[#1B5E36] text-white leading-snug">
            {fmtMin(standtime)} 대기
          </span>
          <span className="text-[11px] text-gray-400 tabular-nums">{count}대</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold text-gray-300">—</span>
          <span className="text-[11px] text-gray-400 tabular-nums">{count}대</span>
        </div>
      )}
    </td>
  );
}

interface Props {
  t1: TaxiStatus | null;
  t2: TaxiStatus | null;
}

export function TaxiStatusCard({ t1, t2 }: Props) {
  const rows = [
    { label: "서울택시",   key: ["seoultaxicnt",     "seoulstandtime"]     },
    { label: "인천택시",   key: ["incheontaxicnt",   "incheonstandtime"]   },
    { label: "경기택시",   key: ["gyenggitaxicnt",   "gyenggistandtime"]   },
    { label: "우등택시",   key: ["besttaxicnt",      "beststandtime"]      },
    { label: "밴택시",     key: ["vantaxicnt",       "vanstandtime"]       },
    { label: "인터내셔널", key: ["intercitytaxicnt", "intercitystandtime"] },
  ] as const;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-2">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pb-2 text-sm font-semibold text-gray-400 w-[4.5rem]" />
            <th className="pb-2 text-center text-sm font-bold text-gray-700">T1</th>
            <th className="pb-2 text-center text-sm font-bold text-gray-700">T2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(({ label, key }) => {
            const [cntKey, timeKey] = key;
            return (
              <tr key={label}>
                <td className="py-3 text-xs font-semibold text-gray-500 pr-2">{label}</td>
                <StandCell
                  count={t1 ? t1[cntKey] : 0}
                  standtime={t1 ? t1[timeKey] : "0000"}
                />
                <StandCell
                  count={t2 ? t2[cntKey] : 0}
                  standtime={t2 ? t2[timeKey] : "0000"}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
