"use client";

import { useRef } from "react";

export function FloatingScrollNav() {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLongPress = useRef(false);

  function scroll(top: number, smooth?: boolean) {
    (document.scrollingElement ?? document.documentElement).scrollBy({ top, behavior: smooth ? "smooth" : "auto" });
  }

  function startPress(dir: "up" | "down") {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      scrollInterval.current = setInterval(() => {
        scroll(dir === "up" ? -80 : 80);
      }, 120);
    }, 300);
  }

  function endPress(dir: "up" | "down") {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null; }
    if (!isLongPress.current) {
      scroll(dir === "up" ? -window.innerHeight * 0.8 : window.innerHeight * 0.8, true);
    }
  }

  return (
    <div className="fixed right-4 z-50 flex flex-col rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg bg-white/20 backdrop-blur-sm divide-y divide-gray-100/30" style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
      {(["up", "down"] as const).map((dir) => (
        <button
          key={dir}
          onPointerDown={() => startPress(dir)}
          onPointerUp={() => endPress(dir)}
          onPointerLeave={() => endPress(dir)}
          aria-label={dir === "up" ? "위로 스크롤" : "아래로 스크롤"}
          className="w-12 h-12 flex items-center justify-center text-gray-500 active:bg-gray-50 transition-colors select-none"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {dir === "up"
              ? <polyline points="4 13 10 7 16 13" />
              : <polyline points="4 7 10 13 16 7" />}
          </svg>
        </button>
      ))}
    </div>
  );
}
