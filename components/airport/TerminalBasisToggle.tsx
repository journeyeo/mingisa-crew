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

  const tabs: { value: Terminal; label: string }[] = [
    { value: "T1", label: "T1 제1터미널" },
    { value: "T2", label: "T2 제2터미널" },
    { value: "GMP", label: "김포공항" },
  ];

  return (
    <div className="flex border-b-2 border-gray-100">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => update(value)}
          className={`flex-1 py-3 text-[15px] font-bold transition-colors border-b-2 -mb-0.5 ${
            terminal === value
              ? "border-[#E65100] text-[#E65100]"
              : "border-transparent text-gray-400"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
