"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Terminal } from "@/lib/airport/types";

interface Props {
  terminal: Terminal;
}

export function TerminalToggle({ terminal }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("terminal", value);
    startTransition(() => {
      router.push(`?${next.toString()}`);
    });
  }

  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold shadow-sm">
      {(["T1", "T2"] as Terminal[]).map((t) => (
        <button
          key={t}
          onClick={() => update(t)}
          className={`px-5 py-2.5 transition-colors ${
            terminal === t
              ? "bg-[#9B1B30] text-white"
              : "bg-white text-gray-400 hover:text-gray-700"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
