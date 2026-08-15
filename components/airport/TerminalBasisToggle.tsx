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
  const [isPending, startTransition] = useTransition();

  function update(value: string) {
    if (isPending) return;
    const next = new URLSearchParams(params.toString());
    next.set("terminal", value);
    startTransition(() => {
      router.push(`?${next.toString()}`);
    });
  }

  return (
    <div className={`flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold shadow-sm transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {(["T1", "T2"] as Terminal[]).map((t) => (
        <button
          key={t}
          onClick={() => update(t)}
          disabled={isPending}
          className={`px-5 py-2.5 transition-colors ${
            terminal === t
              ? "bg-[#9B1B30] text-white"
              : "bg-white text-gray-400 hover:text-gray-700"
          }`}
        >
          {isPending && terminal !== t ? (
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : t}
        </button>
      ))}
    </div>
  );
}
