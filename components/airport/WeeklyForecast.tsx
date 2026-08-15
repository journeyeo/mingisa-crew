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
  const [selectedIdx, setSelectedIdx] = useState(0);
  const day = days[selectedIdx];
  const isToday = selectedIdx === 0;

  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000);
  const nowHour = kst.getUTCHours();
  const nowMinute = kst.getUTCMinutes();

  const labels = day.slots.map((s) => `${String(s.hour).padStart(2, "0")}시`);

  const data = {
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
        ticks: { color: "#9ca3af", font: { size: 10 }, maxTicksLimit: 8 },
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

      // 첫차: 마지막 no-transport 바와 첫 transport 바 사이
      const firstTrainPx = firstTransportIdx > 0
        ? (x.getPixelForValue(firstTransportIdx - 1) + x.getPixelForValue(firstTransportIdx)) / 2
        : null;

      // 지금: 오늘 탭일 때만
      const nowPx = isToday
        ? x.getPixelForValue(nowHour) + barWidth * (nowMinute / 60 - 0.5)
        : null;

      const markers: { px: number; label: string; color: string }[] = [];
      if (firstTrainPx !== null && firstTrainPx >= chartArea.left)
        markers.push({ px: firstTrainPx, label: "첫차", color: "#9B1B30" });
      if (nowPx !== null && nowPx >= chartArea.left && nowPx <= chartArea.right)
        markers.push({ px: nowPx, label: "지금", color: "#C4933F" });

      // 세로 점선 + 선 위 라벨
      ctx.save();
      ctx.font = "600 10px sans-serif";
      const LABEL_W = 28;
      const OFFSET = 3;
      const labelY = chartArea.top - 10;

      // 겹침 방지: center 정렬 기준으로 px 순 정렬 후 row 배정
      const HALF_W = LABEL_W / 2;
      const sorted = [...markers].sort((a, b) => a.px - b.px);
      const rowEdge: number[] = [];
      const labelPositions: { centerPx: number; label: string; color: string; row: number }[] = [];
      for (const { px, label, color } of sorted) {
        // 캔버스 경계 클램프
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 날짜 탭 */}
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
            <span className="text-sm font-bold tabular-nums mt-0.5 text-gray-800">
              {d.totalFlights - d.goldenHourFlights}편
            </span>
            <span className={`text-xs tabular-nums font-semibold leading-none ${d.goldenHourFlights > 0 ? "text-[#9B1B30]" : "text-gray-300"}`}>
              심야 {d.goldenHourFlights}편
            </span>
          </button>
        ))}
      </div>

      {/* 선택된 날 차트 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            {day.label} · 전체 {day.totalFlights}편
          </p>
          {day.goldenHourFlights > 0 && (
            <span className="text-xs text-[#9B1B30] font-semibold">
              심야(막차 이후) {day.goldenHourFlights}편
            </span>
          )}
        </div>
        <div className="h-40">
          <Bar data={data} options={options} plugins={[markersPlugin]} />
        </div>
      </div>
    </div>
  );
}
