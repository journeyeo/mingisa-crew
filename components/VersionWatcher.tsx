"use client";

import { useEffect } from "react";

const CURRENT =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "dev";

export function VersionWatcher() {
  useEffect(() => {
    if (CURRENT === "dev") return;

    const check = async () => {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { version } = await r.json();
        if (version !== CURRENT) {
          window.location.href = window.location.href;
        }
      } catch {}
    };

    const handler = () => {
      if (document.visibilityState === "visible") check();
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return null;
}
