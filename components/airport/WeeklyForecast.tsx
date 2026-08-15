"use client";

import { useState } from "react";
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
import type { WeeklyDay } from "@/lib/airport/types";
import { AREX } from "@/lib/airport/constants";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip);

interface Props {
  days: WeeklyDay[];
}

export function WeeklyForecast({ days }: Props) {
  const [view, setView] = useState<"table" | "chart">("table");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const day = days[selectedIdx];
  const isToday = selectedIdx === 0;

  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const nowHour = kst.getUTCHours();
  const nowMinute = kst.getUTCMinutes();

  const maxTotal = Math.max(...days.map((d) => d.totalFlights), 1);

  // 표 뷰
  const tableView = (
    <div className="px-4 pt-3 pb-3">
      <table className="w-full">
        <thead>
          <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100">
            <th className="text-left pb-2 font-medium">날짜</th>
            <th className="text-right pb-2 font-medium">운항</th>
            <th className="text-right pb-2 font-medium">심야</th>
            <th className="pb-2 pl-3 w-20">분포</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {days.map((d, idx) => {
            const peakSlot = d.slots.length > 0
              ? d.slots.reduce((max, s) => s.flightCount > max.flightCount ? s : max, d.slots[0])
              : null;
            const isFirst = idx === 0;
            const barPct = Math.round((d.totalFlights / maxTotal) * 100);
            return (
              <tr
                key={d.date}
                className={`cursor-pointer ${isFirst ? "font-bold text-gray-900" : "text-gray-700"}`}
                onClick={() => { setSelectedIdx(idx); setView("chart"); }}
              >
                <td className="py-2.5">
                  <span className={`text-sm ${isFirst ? "text-[#C4933F]" : ""}`}>{d.label}</span>
                  <span className="text-xs text-gray-400 ml-1">{d.dayOfWeek}</span>
                </td>
                <td className="py-2.5 text-right tabular-nums text-sm">
                  {d.totalFlights}편
                </td>
                <td className="py-2.5 text-right tabular-nums text-sm" style={{ color: d.goldenHourFlights > 0 ? "#9B1B30" : undefined }}>
                  {d.goldenHourFlights > 0 ? `${d.goldenHourFlights}편` : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2.5 pl-3">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barPct}%`,
                        background: peakSlot?.isNoTransport ? "#9B1B30" : "#C4933F",
                      }}
                    />
                  </div>
                  {peakSlot && (
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      피크 {String(peakSlot.hour).padStart(2, "0")}시
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">행 탭 → 시간대 그래프</p>
    </div>
  );

  // 그래프 뷰 (기존)
  const labels = day.slots.map((s) => `${String(s.hour).padStart(2, "0")}시`);
  const chartData = {
    labels,
    datasets: [
      {
        label: "편수",
        data: day.slots.map((s) => s.flightCount),
        backgroundColor: day.slots.map((s) =>
          s.isNoTransport || s.hour === AREX.lastTrain.hour ? "#9B1B30" : "#C4933F"
        ),
        borderRadius: 4,
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
        callbacks: {
          title: (items) => `${items[0].label}`,
          label: (item) => `${item.raw}편`,
          footer: (items) =>
            day.slots[items[0]?.dataIndex]?.isNoTransport ? "대중교통 없음" : "",
        },
      },
    },
    layout: { padding: { top: 32 } },
    scales: {
      x: {
        ticks: { color: "#9ca3af", font: { size: 11 }, maxTicksLimit: 8 },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: "#9ca3af", font: { size: 11 }, maxTicksLimit: 4, stepSize: 1 },
        grid: { color: "#f4f4f5" },
        border: { display: false },
      },
    },
  };

  const firstTransportIdx = day.slots.findIndex((s) => !s.isNoTransport);

  const markersPlugin = {
    id: "markers",
    afterDraw(chart: ChartJS) {
      const { ctx, scales: { x, y }, chartArea } = chart;
      const barWidth = day.slots.length > 1
        ? x.getPixelForValue(1) - x.getPixelForValue(0)
        : 20;

      const firstTrainPx = firstTransportIdx > 0
        ? (x.getPixelForValue(firstTransportIdx - 1) + x.getPixelForValue(firstTransportIdx)) / 2
        : null;

      const nowPx = isToday
        ? x.getPixelForValue(nowHour) + barWidth * (nowMinute / 60 - 0.5)
        : null;

      const markers: { px: number; label: string; color: string }[] = [];
      if (firstTrainPx !== null && firstTrainPx >= chartArea.left)
        markers.push({ px: firstTrainPx, label: "첫차", color: "#9B1B30" });
      if (nowPx !== null && nowPx >= chartArea.left && nowPx <= chartArea.right)
        markers.push({ px: nowPx, label: "지금", color: "#C4933F" });

      ctx.save();
      ctx.font = "600 10px sans-serif";
      const LABEL_W = 28;
      const labelY = chartArea.top - 10;

      const HALF_W = LABEL_W / 2;
      const sorted = [...markers].sort((a, b) => a.px - b.px);
      const rowEdge: number[] = [];
      const labelPositions: { centerPx: number; label: string; color: string; row: number }[] = [];
      for (const { px, label, color } of sorted) {
        const centerPx = Math.max(chartArea.left + HALF_W, Math.min(px, chartArea.right - HALF_W));
        const left = centerPx - HALF_W;
        const right = centerPx + HALF_W;
        let row = 0;
        while (rowEdge[row] !== undefined && left < rowEdge[row] + 4) row++;
        rowEdge[row] = right;
        labelPositions.push({ centerPx, label, color, row });
      }

      for (const { px, color } of markers) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px, chartArea.top);
        ctx.lineTo(px, chartArea.bottom);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.textAlign = "center";
      for (const { centerPx, label, color, row } of labelPositions) {
        ctx.fillStyle = color;
        ctx.fillText(label, centerPx, labelY - row * 13);
      }

      ctx.restore();
    },
  };

  const chartView = (
    <>
      <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none">
        {days.map((d, idx) => (
          <button
            key={d.date}
            onClick={() => setSelectedIdx(idx)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-3 transition-colors border-b-2 ${
              idx === selectedIdx
                ? "border-[#C4933F] text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="text-xs">{d.label}</span>
            <span className="text-base font-bold tabular-nums mt-0.5 text-gray-800">
              {d.totalFlights - d.goldenHourFlights}편
            </span>
            <span className={`text-xs tabular-nums font-semibold leading-none ${d.goldenHourFlights > 0 ? "text-[#9B1B30]" : "text-gray-300"}`}>
              심야 {d.goldenHourFlights}편
            </span>
          </button>
        ))}
      </div>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-semibold text-gray-700">
            {day.label} · 전체 {day.totalFlights}편
          </p>
          {day.goldenHourFlights > 0 && (
            <span className="text-xs text-[#9B1B30] font-semibold">
              심야(막차 이후) {day.goldenHourFlights}편
            </span>
          )}
        </div>
        <div className="h-40">
          <Bar data={chartData} options={options} plugins={[markersPlugin]} />
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-end px-4 pt-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-100 text-[11px] font-semibold">
          {(["table", "chart"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 transition-colors ${view === v ? "bg-gray-800 text-white" : "bg-white text-gray-400"}`}
            >
              {v === "table" ? "표" : "그래프"}
            </button>
          ))}
        </div>
      </div>
      {view === "table" ? tableView : chartView}
    </div>
  );
}
