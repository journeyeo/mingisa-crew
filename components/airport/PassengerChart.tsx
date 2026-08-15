"use client";

import { useMemo } from "react";
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

// 아시아나 컬러 — 대한항공 통합 오마쥬
// 일반: 골드(진) / 골드(연)  막차 이후: 와인(진) / 와인(연)
const COLOR = {
  normalDark: "#C4933F",   // 아시아나 골드
  normalLight: "#E8C47A",  // 골드 라이트
  alertDark: "#9B1B30",    // 아시아나 와인
  alertLight: "#D4889A",   // 와인 라이트
};

interface Props {
  slots: HourlySlot[];
  tomorrowLabel: string;
}

export function PassengerChart({ slots, tomorrowLabel }: Props) {
  // 00시 슬롯(전날 23시 다음에 오는)에 날짜 레이블 추가
  const labels = slots.map((s, i) => {
    const h = `${String(s.hour).padStart(2, "0")}시`;
    if (s.hour === 0 && i > 0) return [h, tomorrowLabel];
    return h;
  });
  const nowIndex = useMemo(() => {
    const h = new Date().getHours();
    return slots.findIndex((s) => s.hour === h);
  }, [slots]);

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
        ticks: { color: "#a1a1aa", font: { size: 12 } },
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

      // 지금 선
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
        ctx.fillText("지금", px + 4, y.top + 13);
      }

      ctx.restore();
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 pt-4 pb-3">
      <div className="flex items-center gap-5 mb-4 text-sm text-gray-400">
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
      <div className="h-52">
        <Bar data={data} options={options} plugins={[linePlugin]} />
      </div>
    </div>
  );
}
