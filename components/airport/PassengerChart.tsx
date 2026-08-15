"use client";

import { useMemo, useState } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { HourlySlot } from "@/lib/airport/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip);

const COLOR = {
  normalDark: "#C4933F",
  normalLight: "#E8C47A",
  alertDark: "#9B1B30",
  alertLight: "#D4889A",
};

interface Props {
  slots: HourlySlot[];
  tomorrowLabel: string;
}

export function PassengerChart({ slots, tomorrowLabel }: Props) {
  const [view, setView] = useState<"chart" | "table">("table");

  const labels = slots.map((s, i) => {
    const h = `${String(s.hour).padStart(2, "0")}시`;
    if (s.hour === 0 && i > 0) return [h, tomorrowLabel];
    return h;
  });
  const nowIndex = useMemo(() => {
    const h = new Date().getHours();
    return slots.findIndex((s) => s.hour === h);
  }, [slots]);

  const ranked = useMemo(() =>
    slots
      .map((s, i) => ({ i, total: s.foreignCount + s.domesticCount }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3),
  [slots]);
  const rankedSet = useMemo(() => new Set(ranked.map((r) => r.i)), [ranked]);

  const data = {
    labels,
    datasets: [
      {
        label: "외국인",
        data: slots.map((s) => s.foreignCount),
        backgroundColor: slots.map((s) => s.isNoTransport ? COLOR.alertDark : COLOR.normalDark),
        stack: "a",
      },
      {
        label: "내국인",
        data: slots.map((s) => s.domesticCount),
        backgroundColor: slots.map((s) => s.isNoTransport ? COLOR.alertLight : COLOR.normalLight),
        stack: "a",
        borderRadius: { topLeft: 4, topRight: 4 },
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#111",
        bodyColor: "#52525b",
        footerColor: "#9B1B30",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => `${items[0].label}`,
          footer: (items) => slots[items[0]?.dataIndex]?.isNoTransport ? "대중교통 없음" : "",
        },
      },
    },
    layout: { padding: { top: 20 } },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: (ctx) => rankedSet.has(ctx.index) ? "#111827" : "#a1a1aa",
          font: (ctx) => rankedSet.has(ctx.index)
            ? { size: 12, weight: "bold" }
            : { size: 12 },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        ticks: { color: "#a1a1aa", font: { size: 12 }, maxTicksLimit: 4 },
        grid: { color: "#f4f4f5" },
        border: { display: false },
      },
    },
  };

  const linePlugin = {
    id: "lines",
    afterDraw(chart: ChartJS) {
      const { ctx, scales: { x, y } } = chart;
      ctx.save();
      if (nowIndex >= 0) {
        const px = x.getPixelForValue(nowIndex);
        ctx.strokeStyle = "#C4933F";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(px, y.top);
        ctx.lineTo(px, y.bottom);
        ctx.stroke();
        ctx.fillStyle = "#C4933F";
        ctx.font = "700 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("지금", px, y.top - 6);
      }
      ctx.restore();
    },
  };

  const tableSlots = slots;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR.normalDark }} />외국인
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR.normalLight }} />내국인
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLOR.alertDark }} />막차 이후
          </span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-100 text-[11px] font-semibold">
          {(["table", "chart"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 transition-colors ${view === v ? "bg-gray-800 text-white" : "bg-white text-gray-400"}`}
            >
              {v === "chart" ? "그래프" : "표"}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <div className="h-52">
          <Bar data={data} options={options} plugins={[linePlugin]} />
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64">
          <table className="w-full">
            <thead>
              <tr className="text-base text-gray-600 border-b border-gray-100">
                <th className="text-left pb-2 font-semibold w-36">시간</th>
                <th className="text-right pb-2 font-semibold">외국인</th>
                <th className="text-right pb-2 font-semibold">내국인</th>
                <th className="text-right pb-2 font-semibold">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableSlots.map((s, i) => {
                const total = s.foreignCount + s.domesticCount;
                const isNow = slots.indexOf(s) === nowIndex;
                const isNext = s.hour === 0 && slots.indexOf(s) > 0;
                return (
                  <tr
                    key={i}
                    className={isNow
                      ? "bg-amber-50 font-bold text-gray-900"
                      : "text-gray-700"}
                  >
                    <td className="py-2 rounded-l-lg pl-1">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                          {isNext && <span className="text-[10px] text-amber-500 leading-none">{tomorrowLabel}</span>}
                          <span className="text-base tabular-nums font-semibold">{String(s.hour).padStart(2, "0")}시</span>
                          {s.isNoTransport && <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full leading-none" style={{ background: "#9B1B30" }}>심야</span>}
                          {isNow && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white leading-none" style={{ background: "#C4933F" }}>지금</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-lg font-semibold" style={{ color: COLOR.normalDark }}>{s.foreignCount.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums text-lg text-gray-500">{s.domesticCount.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums text-lg font-bold text-gray-900 pr-1 rounded-r-lg">{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
