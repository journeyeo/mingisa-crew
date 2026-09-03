import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "민기사 크루",
  description: "인천공항 시간대별 입국 수요 · 기사용",
  openGraph: {
    title: "민기사 크루",
    description: "인천공항 시간대별 입국 수요 · 기사용",
    images: [{ url: "/og-image-crew.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "민기사크루",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
