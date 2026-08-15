"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Terminal } from "@/lib/airport/types";

interface Props {
  terminal: Terminal;
}

export function TerminalToggle({ terminal }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function update(value: Terminal) {
    startTransition(() => {
      router.push(`?terminal=${value}`);
    });
  }

  return (
    <div className="flex border-b-2 border-gray-100">
      {(["T1", "T2"] as Terminal[]).map((t) => (
        <button
          key={t}
          onClick={() => update(t)}
          className={`flex-1 py-3 text-base font-bold transition-colors border-b-2 -mb-0.5 ${
            terminal === t
              ? "border-[#9B1B30] text-[#9B1B30]"
              : "border-transparent text-gray-400"
          }`}
        >
          {t === "T1" ? "T1 제1터미널" : "T2 제2터미널"}
        </button>
      ))}
    </div>
  );
}
