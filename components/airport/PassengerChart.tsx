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
  const [view, setView] = useState<"chart" | "table">("chart");

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
        ctx.textAlign = "left";
        ctx.fillText("지금", px + 4, y.top + 13);
      }
      ctx.restore();
    },
  };

  const tableSlots = slots.filter((s) => s.foreignCount + s.domesticCount > 0);

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
          {(["chart", "table"] as const).map((v) => (
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
        <div className="overflow-y-auto max-h-52">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">시간</th>
                <th className="text-right pb-2 font-medium">외국인</th>
                <th className="text-right pb-2 font-medium">내국인</th>
                <th className="text-right pb-2 font-medium">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableSlots.map((s, i) => {
                const total = s.foreignCount + s.domesticCount;
                const isNow = slots.indexOf(s) === nowIndex;
                const isNext = s.hour === 0 && slots.indexOf(s) > 0;
                return (
                  <tr key={i} className={isNow ? "font-semibold text-gray-900" : "text-gray-600"}>
                    <td className="py-1.5 tabular-nums">
                      {isNext && <span className="text-[10px] text-amber-500 mr-1">{tomorrowLabel}</span>}
                      {String(s.hour).padStart(2, "0")}시
                      {isNow && <span className="ml-1 text-[10px] text-[#C4933F] font-bold">지금</span>}
                      {s.isNoTransport && <span className="ml-1 text-[10px] text-[#9B1B30] font-bold">심야</span>}
                    </td>
                    <td className="py-1.5 text-right tabular-nums" style={{ color: COLOR.normalDark }}>{s.foreignCount.toLocaleString()}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-500">{s.domesticCount.toLocaleString()}</td>
                    <td className="py-1.5 text-right tabular-nums font-medium text-gray-900">{total.toLocaleString()}</td>
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
