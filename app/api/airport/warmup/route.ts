import { getCachedSummary, getCachedFlights } from "@/lib/airport/cached-data";
import type { Terminal } from "@/lib/airport/types";

export async function GET() {
  const now = new Date();
  const toKST = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replace(/-/g, "");
  const todayStr = toKST(now);
  const tomorrowStr = toKST(new Date(now.getTime() + 86_400_000));

  const terminals: Terminal[] = ["T1", "T2"];
  await Promise.all(
    terminals.flatMap((t) => [
      getCachedSummary(t, todayStr, tomorrowStr),
      getCachedFlights(t, todayStr, tomorrowStr),
    ])
  );

  return Response.json({ ok: true, refreshed: now.toISOString() });
}
