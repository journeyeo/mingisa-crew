const CHART_BAR_HEIGHTS = [35, 55, 70, 45, 80, 60, 30, 50, 65, 40, 25, 45];

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* 상단 로딩 바 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
        <div
          className="h-full rounded-full"
          style={{
            background: "#C4933F",
            animation: "loading-bar 2.5s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes loading-bar {
          0%   { width: 0%;   opacity: 1; }
          70%  { width: 85%;  opacity: 1; }
          90%  { width: 92%;  opacity: 1; }
          100% { width: 92%;  opacity: 0; }
        }
      `}</style>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* 상단 */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* 그래프 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
          <div className="flex gap-5 mb-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>
          <div className="h-52 flex items-end gap-1">
            {CHART_BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse bg-gray-100 rounded-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>

        {/* 항공편 슬라이더 */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-4 border-b border-gray-100 space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
            <div className="px-4 py-2 flex gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center px-4 py-3.5 gap-3 border-t border-gray-50">
                <Skeleton className="w-20 h-5" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-24 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* 주간 예측 */}
        <div>
          <Skeleton className="h-4 w-20 mb-3" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center px-4 py-3 gap-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="flex-1 h-3" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* 주차 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

      </div>
    </main>
  );
}
