"use client";

import type { TaxiStatus } from "@/app/api/airport/taxi/route";

interface StandCellProps {
  count: number;
  standtime: string;
}

function StandCell({ count }: StandCellProps) {
  return (
    <td className="py-3.5 text-center">
      <span className="text-base font-bold text-gray-800 tabular-nums">{count}<span className="text-sm font-normal text-gray-400 ml-0.5">대</span></span>
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
            <th className="pb-2 text-center text-base font-bold text-gray-800">T1</th>
            <th className="pb-2 text-center text-base font-bold text-gray-800">T2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(({ label, key }) => {
            const [cntKey, timeKey] = key;
            return (
              <tr key={label}>
                <td className="py-3.5 text-sm font-semibold text-gray-600 pr-2">{label}</td>
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
