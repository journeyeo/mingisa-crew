import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공항 수요 대시보드 — 밍기사 크루",
  description: "인천공항 시간대별 입국 수요 · 기사용",
};

export default function AirportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
