"use client";

import { useEffect, useState } from "react";
import type { CheckinRecord, CheckinStats, Terminal } from "@/lib/airport/types";

interface Props {
  terminal: Terminal;
}

export function CheckinPanel({ terminal }: Props) {
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [driverName, setDriverName] = useState("");
  const [myRecord, setMyRecord] = useState<CheckinRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // localStorage에서 이름 복원
  useEffect(() => {
    const saved = localStorage.getItem("driverName");
    if (saved) setDriverName(saved);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [terminal]);

  async function fetchStats() {
    const res = await fetch(`/api/airport/checkin?terminal=${terminal}`);
    if (res.ok) setStats(await res.json());
  }

  async function handleEnter() {
    if (!driverName.trim()) return;
    localStorage.setItem("driverName", driverName.trim());
    setLoading(true);
    const res = await fetch("/api/airport/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverName: driverName.trim(), terminal }),
    });
    if (res.ok) {
      const record = await res.json();
      setMyRecord(record);
      fetchStats();
    }
    setLoading(false);
  }

  async function handleBoard() {
    if (!myRecord) return;
    setLoading(true);
    await fetch("/api/airport/checkin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: myRecord.id }),
    });
    setMyRecord(null);
    fetchStats();
    setLoading(false);
  }

  const waitingCount = stats?.active.length ?? 0;
  const avgWait = stats?.avgWaitMinutes;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">기사 현황</h3>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>대기 <span className="text-white font-bold">{waitingCount}명</span></span>
          {avgWait != null && (
            <span>평균 대기 <span className="text-white font-bold">{avgWait}분</span></span>
          )}
        </div>
      </div>

      {/* 대기중인 기사 목록 */}
      {stats && stats.active.length > 0 && (
        <div className="space-y-1">
          {stats.active.map((r) => {
            const waited = Math.floor(
              (Date.now() - new Date(r.enteredAt).getTime()) / 60_000
            );
            return (
              <div key={r.id} className="flex justify-between text-xs text-gray-400">
                <span>{r.driverName}</span>
                <span>{waited}분째 대기</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 체크인 컨트롤 */}
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <input
          type="text"
          placeholder="기사 이름 또는 번호"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          disabled={!!myRecord}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 disabled:opacity-50"
        />
        {!myRecord ? (
          <button
            onClick={handleEnter}
            disabled={loading || !driverName.trim()}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
          >
            대기 진입
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center">
              대기 중... {Math.floor((Date.now() - new Date(myRecord.enteredAt).getTime()) / 60_000)}분
            </p>
            <button
              onClick={handleBoard}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
            >
              탑승 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
