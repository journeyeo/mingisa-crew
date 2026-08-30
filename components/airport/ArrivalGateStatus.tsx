"use client";

interface CongestionEntry {
  flightid: string;
  entrygate: string;
  airport: string;
  gatenumber: string;
  korean: number;
  foreigner: number;
  scheduletime: string;
  estimatedtime: string;
}

interface Props {
  congestion: CongestionEntry[];
  terminal: string;
}

function parseKST(dt: string): string {
  // "202608191430" → "14:30"
  if (!dt || dt.length < 12) return "";
  return `${dt.slice(8, 10)}:${dt.slice(10, 12)}`;
}

export function ArrivalGateStatus({ congestion }: Props) {
  if (congestion.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-8 text-center text-gray-400 text-sm">
        현재 입국장 대기 정보가 없습니다
      </div>
    );
  }

  // 입국장별 그룹핑
  const byGate = new Map<string, CongestionEntry[]>();
  for (const item of congestion) {
    const gate = item.entrygate || "?";
    if (!byGate.has(gate)) byGate.set(gate, []);
    byGate.get(gate)!.push(item);
  }

  const gates = [...byGate.entries()].sort(([a], [b]) => a.localeCompare(b));
  const maxTotal = Math.max(...gates.map(([, items]) =>
    items.reduce((s, i) => s + i.foreigner + i.korean, 0)
  ), 1);

  return (
    <div className="space-y-3">
      {/* 입국장별 바 요약 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">입국장별 도착 처리</p>
        <div className="space-y-2">
          {gates.map(([gate, items]) => {
            const total = items.reduce((s, i) => s + i.foreigner + i.korean, 0);
            const foreign = items.reduce((s, i) => s + i.foreigner, 0);
            const pct = Math.round((total / maxTotal) * 100);
            return (
              <div key={gate} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700 w-6 flex-shrink-0">{gate}</span>
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#1B5E36] rounded transition-all"
                    style={{ width: `${pct}%`, minWidth: total > 0 ? "4px" : "0" }}
                  />
                </div>
                <div className="text-right flex-shrink-0 w-24">
                  <span className="text-sm font-bold tabular-nums text-gray-800">{total.toLocaleString()}명</span>
                  <span className="text-xs text-gray-400 ml-1">외 {foreign.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 편별 상세 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400">시간대 내 운항편</p>
        </div>
        <div className="divide-y divide-gray-50">
          {congestion
            .slice()
            .sort((a, b) => (b.foreigner + b.korean) - (a.foreigner + a.korean))
            .map((item, i) => {
              const total = item.foreigner + item.korean;
              const sched = parseKST(item.scheduletime);
              const actual = parseKST(item.estimatedtime);
              const isDelayed = actual && sched && actual !== sched;
              return (
                <div key={i} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">{item.entrygate}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-800">{item.flightid}</span>
                      <span className="text-xs text-gray-400 truncate">{item.airport}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">{sched}</span>
                      {isDelayed && <span className="text-xs text-orange-500">{actual}</span>}
                      {item.gatenumber && <span className="text-xs text-gray-300">게이트 {item.gatenumber}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums text-gray-800">{total.toLocaleString()}명</p>
                    <p className="text-xs tabular-nums text-gray-400">외 {item.foreigner.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <p className="text-center text-xs text-gray-300 mt-3">
        인천국제공항공사 실시간 운항정보 · 5분 갱신
      </p>
    </div>
  );
}
