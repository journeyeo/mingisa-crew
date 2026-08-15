import type { CheckinRecord, CheckinStats, Terminal } from "./types";

// 서버 메모리 저장소 (6명 규모, cold start 시 초기화됨)
// 운영 확장 시 DB로 교체
declare global {
  // eslint-disable-next-line no-var
  var __checkinStore: CheckinRecord[] | undefined;
}

function getStore(): CheckinRecord[] {
  if (!global.__checkinStore) global.__checkinStore = [];
  return global.__checkinStore;
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

function pruneOld(): void {
  const cutoff = Date.now() - THREE_HOURS;
  global.__checkinStore = getStore().filter(
    (r) => new Date(r.enteredAt).getTime() > cutoff
  );
}

export function addCheckin(
  driverName: string,
  terminal: Terminal
): CheckinRecord {
  pruneOld();
  const record: CheckinRecord = {
    id: crypto.randomUUID(),
    driverName,
    terminal,
    enteredAt: new Date().toISOString(),
  };
  getStore().push(record);
  return record;
}

export function markBoarded(id: string): CheckinRecord | null {
  const record = getStore().find((r) => r.id === id);
  if (!record) return null;
  record.boardedAt = new Date().toISOString();
  return record;
}

export function getCheckinStats(terminal?: Terminal): CheckinStats {
  pruneOld();
  const all = getStore();
  const relevant = terminal ? all.filter((r) => r.terminal === terminal) : all;

  const active = relevant.filter((r) => !r.boardedAt);
  const completed = relevant.filter((r) => r.boardedAt);

  const waitTimes = completed.map((r) => {
    const entered = new Date(r.enteredAt).getTime();
    const boarded = new Date(r.boardedAt!).getTime();
    return (boarded - entered) / 60_000;
  });

  const avgWaitMinutes =
    waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : null;

  const recentCompletions = completed
    .sort((a, b) => new Date(b.boardedAt!).getTime() - new Date(a.boardedAt!).getTime())
    .slice(0, 5);

  return { active, avgWaitMinutes, recentCompletions };
}
