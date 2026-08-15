"use client";

export function FloatingScrollNav() {
  function scrollBy(dir: "up" | "down") {
    window.scrollBy({ top: dir === "up" ? -window.innerHeight * 0.8 : window.innerHeight * 0.8, behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg bg-white/20 backdrop-blur-sm divide-y divide-gray-100/30">
      <button
        onClick={() => scrollBy("up")}
        aria-label="위로 스크롤"
        className="w-12 h-12 flex items-center justify-center text-gray-500 active:bg-gray-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 13 10 7 16 13" />
        </svg>
      </button>
      <button
        onClick={() => scrollBy("down")}
        aria-label="아래로 스크롤"
        className="w-12 h-12 flex items-center justify-center text-gray-500 active:bg-gray-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 10 13 16 7" />
        </svg>
      </button>
    </div>
  );
}
