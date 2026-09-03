"use client";

import { useState, useEffect } from "react";
import type { WeatherData, HourlyForecast, DailyForecast } from "@/app/api/weather/route";

// ── 아이콘 ────────────────────────────────────────────────────────────────────

function skyIcon(sky: number, pty: number, size = 20): React.ReactNode {
  if (pty === 1 || pty === 4) return <RainIcon size={size} />;
  if (pty === 2) return <RainSnowIcon size={size} />;
  if (pty === 3) return <SnowIcon size={size} />;
  if (sky === 4) return <CloudyIcon size={size} />;
  if (sky === 3) return <PartlyCloudyIcon size={size} />;
  return <SunIcon size={size} />;
}

function skyLabel(sky: number, pty: number): string {
  if (pty === 1 || pty === 4) return "비";
  if (pty === 2) return "비/눈";
  if (pty === 3) return "눈";
  if (sky === 4) return "흐림";
  if (sky === 3) return "구름많음";
  return "맑음";
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

function PartlyCloudyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="10" cy="10" r="3" stroke="#F59E0B" />
      <path d="M10 4v1M10 15v1M4 10H5M15 10h1M5.64 5.64l.71.71M14.65 14.65l.71.71" stroke="#F59E0B" />
      <path d="M17 17H8a4 4 0 0 1 0-8h.5A5 5 0 0 1 18 13.5 3.5 3.5 0 0 1 17 17z" fill="#E5E7EB" stroke="#9CA3AF" />
    </svg>
  );
}

function CloudyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function RainIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#9CA3AF" />
      <line x1="8" y1="19" x2="6" y2="23" stroke="#60A5FA" />
      <line x1="12" y1="19" x2="10" y2="23" stroke="#60A5FA" />
      <line x1="16" y1="19" x2="14" y2="23" stroke="#60A5FA" />
    </svg>
  );
}

function RainSnowIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#9CA3AF" />
      <line x1="8" y1="19" x2="6" y2="23" stroke="#60A5FA" />
      <line x1="16" y1="19" x2="14" y2="23" stroke="#A78BFA" />
      <circle cx="11" cy="22" r="1" fill="#A78BFA" />
    </svg>
  );
}

function SnowIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#9CA3AF" />
      <circle cx="8" cy="22" r="1" fill="#A78BFA" />
      <circle cx="12" cy="22" r="1" fill="#A78BFA" />
      <circle cx="16" cy="22" r="1" fill="#A78BFA" />
    </svg>
  );
}

// ── 뱃지 (헤더에 표시) ────────────────────────────────────────────────────────

interface BadgeProps {
  data: WeatherData;
  onClick: () => void;
}

export function WeatherBadge({ data, onClick }: BadgeProps) {
  const { current } = data;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors"
    >
      {skyIcon(current.sky, current.pty, 18)}
      <span className="text-sm font-semibold text-gray-700 tabular-nums">
        {Math.round(current.temp)}°
      </span>
    </button>
  );
}

// ── 모달 ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  data: WeatherData;
  onClose: () => void;
}

function fmtTime(time: string): string {
  const h = parseInt(time.slice(0, 2));
  if (h === 0) return "자정";
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return "정오";
  return `오후 ${h - 12}시`;
}

function fmtDate(date: string, time: string): string {
  const kst = new Date(
    parseInt(date.slice(0, 4)),
    parseInt(date.slice(4, 6)) - 1,
    parseInt(date.slice(6, 8))
  );
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const day = dayNames[kst.getDay()];
  const isToday = date === (() => {
    const now = new Date(new Date().getTime() + 9 * 3600_000);
    return now.toISOString().slice(0, 10).replace(/-/g, "");
  })();
  const label = isToday ? "오늘" : `${parseInt(date.slice(6, 8))}일 (${day})`;
  return `${label} ${fmtTime(time)}`;
}

export function WeatherModal({ data, onClose }: ModalProps) {
  const { current, hourly, tmn, tmx } = data;
  const [tab, setTab] = useState<"weekly" | "hourly">("hourly");
  let lastDate = "";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 현재 날씨 */}
        <div className="px-6 pt-3 pb-5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1">인천공항 현재 날씨</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-gray-900 tabular-nums">
                  {Math.round(current.temp)}°
                </span>
                <span className="text-lg text-gray-500 mb-1.5">{skyLabel(current.sky, current.pty)}</span>
              </div>
              {(tmn !== null || tmx !== null) && (
                <p className="text-sm text-gray-400 mt-1">
                  {tmn !== null && `최저 ${Math.round(tmn)}°`}
                  {tmn !== null && tmx !== null && "  "}
                  {tmx !== null && `최고 ${Math.round(tmx)}°`}
                </p>
              )}
            </div>
            <div className="mr-2">
              {skyIcon(current.sky, current.pty, 64)}
            </div>
          </div>
          {(current.humidity > 0 || current.windSpeed > 0) && (
            <div className="flex gap-4 mt-3">
              {current.humidity > 0 && <span className="text-sm text-gray-400">습도 {current.humidity}%</span>}
              {current.windSpeed > 0 && <span className="text-sm text-gray-400">풍속 {current.windSpeed}m/s</span>}
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-100 px-6">
          {(["hourly", "weekly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 mr-5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t ? "border-gray-800 text-gray-800" : "border-transparent text-gray-400"
              }`}
            >
              {t === "hourly" ? "시간별 예보" : "주간 예보"}
            </button>
          ))}
        </div>

        {/* 주간 예보 */}
        {tab === "weekly" && (
          <div className="overflow-y-auto overscroll-contain px-6 pt-4 pb-6" style={{ height: "288px" }}>
            <div className="space-y-4">
              {data.daily.map((d: DailyForecast) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="w-10 text-base font-medium text-gray-600">{d.label}</span>
                  <span className="w-7">{skyIcon(d.skyAm, d.ptyAm, 20)}</span>
                  <span className="w-7">{skyIcon(d.skyPm, d.ptyPm, 20)}</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    {(d.popAm > 0 || d.popPm > 0) && (
                      <span className="text-sm text-blue-400 tabular-nums">
                        {Math.max(d.popAm, d.popPm)}%
                      </span>
                    )}
                  </div>
                  <span className="text-base tabular-nums text-blue-400 w-10 text-right">
                    {d.tmn !== null ? `${Math.round(d.tmn)}°` : ""}
                  </span>
                  <span className="text-sm text-gray-300 mx-0.5">/</span>
                  <span className="text-base tabular-nums font-semibold text-red-400 w-10">
                    {d.tmx !== null ? `${Math.round(d.tmx)}°` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간별 예보 */}
        {tab === "hourly" && (
          <div className="overflow-y-auto overscroll-contain" style={{ height: "288px" }}>
            {hourly.map((h: HourlyForecast, i: number) => {
              const showDateDivider = h.date !== lastDate && i > 0;
              lastDate = h.date;
              return (
                <div key={`${h.date}_${h.time}`}>
                  {showDateDivider && (
                    <div className="px-6 py-1.5 bg-gray-50">
                      <span className="text-sm font-medium text-gray-500">
                        {(() => {
                          const kst = new Date(
                            parseInt(h.date.slice(0, 4)),
                            parseInt(h.date.slice(4, 6)) - 1,
                            parseInt(h.date.slice(6, 8))
                          );
                          const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                          return `${parseInt(h.date.slice(6, 8))}일 (${dayNames[kst.getDay()]})`;
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center px-6 py-3.5 border-b border-gray-50">
                    <span className="w-20 text-base text-gray-600">{fmtTime(h.time)}</span>
                    <span className="w-8">{skyIcon(h.sky, h.pty, 22)}</span>
                    <span className="flex-1 text-base text-gray-500">{skyLabel(h.sky, h.pty)}</span>
                    {h.pop > 0 && (
                      <span className="text-sm text-blue-400 mr-3 tabular-nums">{h.pop}%</span>
                    )}
                    <span className="text-base font-semibold text-gray-800 tabular-nums w-10 text-right">
                      {Math.round(h.temp)}°
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="h-4" />
          </div>
        )}

        {/* 출처 */}
        <div className="px-6 py-2 border-t border-gray-50">
          <p className="text-xs text-gray-300 text-center">기상청 단기·중기예보 / 인천공항(영종도) 기준</p>
        </div>

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── 통합 훅 ──────────────────────────────────────────────────────────────────

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return data;
}
